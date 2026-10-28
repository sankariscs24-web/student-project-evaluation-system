import re
import tokenize
import io
from typing import List, Dict, Any, Tuple

def strip_comments_and_whitespace(code: str, language: str = "python") -> str:
    """Removes comments and excessive whitespace based on language."""
    if not code:
        return ""

    if language.lower() == "python":
        try:
            tokens = tokenize.generate_tokens(io.StringIO(code).readline)
            result = []
            for tok_type, tok_string, _, _, _ in tokens:
                if tok_type not in (tokenize.COMMENT, tokenize.NL):
                    result.append(tok_string)
            cleaned = " ".join(result)
        except Exception:
            cleaned = re.sub(r'#.*', '', code)
    else:
        # C, C++, Java comment stripping
        cleaned = re.sub(r'//.*', '', code)
        cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)

    # Normalize whitespace
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    return "\n".join(lines)


def tokenize_code(code: str, language: str = "python") -> List[str]:
    """
    Tokenizes code into a normalized token stream.
    Replaces custom identifiers with generic 'ID' tokens while preserving keywords,
    built-ins, and operators. This detects plagiarism even when variables are renamed.
    """
    keywords = {
        # Python keywords
        "def", "class", "if", "elif", "else", "for", "while", "return", "in", "is",
        "and", "or", "not", "try", "except", "finally", "with", "as", "import", "from",
        "lambda", "yield", "break", "continue", "pass", "True", "False", "None",
        "range", "len", "print", "append", "sum", "min", "max",
        # C/C++/Java keywords
        "int", "float", "double", "char", "bool", "boolean", "void", "public", "private",
        "static", "new", "class", "include", "main", "cout", "cin", "printf", "scanf",
        "vector", "string", "map", "set", "System", "out", "println"
    }

    if language.lower() == "python":
        try:
            tokens = []
            for tok_type, tok_str, _, _, _ in tokenize.generate_tokens(io.StringIO(code).readline):
                if tok_type == tokenize.NAME:
                    tokens.append(tok_str if tok_str in keywords else "VAR")
                elif tok_type == tokenize.NUMBER:
                    tokens.append("NUM")
                elif tok_type == tokenize.STRING:
                    tokens.append("STR")
                elif tok_type == tokenize.OP:
                    tokens.append(tok_str)
            return tokens
        except Exception:
            pass

    # Generic fallback tokenizer using regex
    raw_tokens = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*|[0-9]+|==|!=|<=|>=|\+\+|--|->|&&|\|\||[^\s\w]', code)
    norm_tokens = []
    for t in raw_tokens:
        if t in keywords:
            norm_tokens.append(t)
        elif re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', t):
            norm_tokens.append("VAR")
        elif re.match(r'^[0-9]+$', t):
            norm_tokens.append("NUM")
        else:
            norm_tokens.append(t)
    return norm_tokens


def extract_k_grams(tokens: List[str], k: int = 5) -> set:
    """Generates k-gram tuple hashes from token stream."""
    if len(tokens) < k:
        return set([tuple(tokens)]) if tokens else set()
    return set(tuple(tokens[i:i+k]) for i in range(len(tokens) - k + 1))


def find_matching_line_snippets(code1: str, code2: str) -> List[Dict[str, Any]]:
    """
    Finds contiguous matching blocks of lines between two source codes.
    Returns list of matches with line numbers and preview text.
    """
    lines1 = [line.strip() for line in code1.splitlines()]
    lines2 = [line.strip() for line in code2.splitlines()]

    matches = []
    min_match_len = 3  # Minimum consecutive matching lines

    i = 0
    while i < len(lines1):
        if not lines1[i] or len(lines1[i]) < 4:
            i += 1
            continue

        best_match = None
        for j in range(len(lines2)):
            if lines1[i] == lines2[j]:
                # Expand match
                match_len = 0
                while (i + match_len < len(lines1) and
                       j + match_len < len(lines2) and
                       lines1[i + match_len] == lines2[j + match_len] and
                       lines1[i + match_len]):
                    match_len += 1

                if match_len >= min_match_len:
                    if not best_match or match_len > best_match["length"]:
                        best_match = {
                            "source_start": i + 1,
                            "source_end": i + match_len,
                            "target_start": j + 1,
                            "target_end": j + match_len,
                            "length": match_len,
                            "snippet": "\n".join(lines1[i:i + match_len])
                        }

        if best_match:
            matches.append(best_match)
            i += best_match["length"]
        else:
            i += 1

    return matches[:10]  # Cap at top 10 matched snippets


def calculate_similarity(
    code1: str,
    code2: str,
    language1: str = "python",
    language2: str = "python"
) -> Dict[str, Any]:
    """
    Calculates plagiarism similarity between two code submissions using:
    1. Token sequence normalization (variable rename resilience)
    2. K-gram Jaccard and containment metrics
    3. Structural block detection
    """
    if not code1 or not code2:
        return {
            "similarity_score": 0.0,
            "status": "Clean",
            "matched_tokens_count": 0,
            "matched_snippets": [],
            "explanation": "Insufficient code content to compare."
        }

    # Normalize code
    clean1 = strip_comments_and_whitespace(code1, language1)
    clean2 = strip_comments_and_whitespace(code2, language2)

    tokens1 = tokenize_code(clean1, language1)
    tokens2 = tokenize_code(clean2, language2)

    if not tokens1 or not tokens2:
        return {
            "similarity_score": 0.0,
            "status": "Clean",
            "matched_tokens_count": 0,
            "matched_snippets": [],
            "explanation": "No tokenizable code found."
        }

    k = 5 if min(len(tokens1), len(tokens2)) >= 5 else max(2, min(len(tokens1), len(tokens2)))
    grams1 = extract_k_grams(tokens1, k)
    grams2 = extract_k_grams(tokens2, k)

    intersection = grams1.intersection(grams2)
    union = grams1.union(grams2)

    jaccard = (len(intersection) / len(union)) if union else 0.0
    containment = (len(intersection) / min(len(grams1), len(grams2))) if grams1 and grams2 else 0.0

    # Weighted score emphasizing containment and token overlap
    similarity_score = round(((jaccard * 0.4) + (containment * 0.6)) * 100, 1)
    similarity_score = min(100.0, max(0.0, similarity_score))

    matched_snippets = find_matching_line_snippets(code1, code2)

    if similarity_score >= 65.0:
        status = "Suspicious"
        explanation = (
            f"High similarity ({similarity_score}%). Code structure and token sequences "
            f"exhibit substantial congruence with another submission. Variable renaming or "
            f"whitespace reformatting was detected. Faculty review recommended."
        )
    elif similarity_score >= 40.0:
        status = "Moderate Similarity"
        explanation = (
            f"Moderate similarity ({similarity_score}%). Common algorithmic structures and shared "
            f"patterns were detected ({len(intersection)} shared token k-grams). Standard solution patterns may account for this."
        )
    else:
        status = "Clean"
        explanation = (
            f"Low similarity ({similarity_score}%). Submissions use distinct logic and variable structures."
        )

    return {
        "similarity_score": similarity_score,
        "status": status,
        "matched_tokens_count": len(intersection),
        "matched_snippets": matched_snippets,
        "explanation": explanation
    }
