#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace {

constexpr std::size_t MAX_MESSAGE_BYTES = 1024 * 1024;

std::string lower_copy(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return value;
}

std::string normalize_level(const std::string& level, const std::string& message) {
    if (!level.empty() && level != "-") {
        return lower_copy(level);
    }
    const std::string lowered = lower_copy(message);
    for (const auto& candidate : std::vector<std::string>{"fatal", "error", "warn", "warning", "info", "debug", "trace"}) {
        if (lowered.find(candidate) != std::string::npos) {
            return candidate == "warning" ? "warn" : candidate;
        }
    }
    return "info";
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    std::ostringstream buffer;
    buffer << std::cin.rdbuf();
    const std::string input = buffer.str();
    if (input.size() > MAX_MESSAGE_BYTES) return 3;
    std::cout << normalize_level(argv[1], input) << "\n";
    return 0;
}
// Project version: LogForge V1.4
