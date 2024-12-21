import json
import sys

def load_word_list(file_path):
    with open(file_path, 'r') as file:
        words = set(word.strip().lower() for word in file.readlines())
    return words

def check_sensitivity(input_sentence, sexual_words, violence_words, threat_words):
    sensitivity_results = []
    words = input_sentence.lower().split()
    for word in words:
        sensitivity = None
        if word in sexual_words:
            sensitivity = 'Sexual'
        elif word in violence_words:
            sensitivity = 'Violence'
        elif word in threat_words:
            sensitivity = 'Threat'
        sensitivity_results.append((word, sensitivity))
    return sensitivity_results

if __name__ == "__main__":
    sexual_words = load_word_list(sys.argv[1])
    violence_words = load_word_list(sys.argv[2])
    threat_words = load_word_list(sys.argv[3])
    input_sentence = sys.argv[4]

    results = check_sensitivity(input_sentence, sexual_words, violence_words, threat_words)
    print(json.dumps(results))
