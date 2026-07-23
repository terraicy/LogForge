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

std::string value_after(const std::string& message, const std::string& key) {
    const std::string lowered = lower_copy(message);
    const auto pos = lowered.find(key + "=");
    if (pos == std::string::npos) {
        return "";
    }
    const auto start = pos + key.size() + 1;
    auto end = lowered.find_first_of(" \t\r\n,;", start);
    if (end == std::string::npos) {
        end = message.size();
    }
    return message.substr(start, end - start);
}

void write_field_lines(const std::string& message) {
    for (const auto& key : std::vector<std::string>{"service", "host", "trace_id", "request_id", "user"}) {
        const auto value = value_after(message, key);
        if (!value.empty()) {
            std::cout << key << "=" << value << "\n";
        }
    }
}

void write_preset(const std::string& name) {
    const std::string key = lower_copy(name);
    if (key == "errors") {
        std::cout << "{\"level\":\"error\",\"limit\":100}\n";
    } else if (key == "auth") {
        std::cout << "{\"text\":\"login\",\"limit\":100}\n";
    } else if (key == "slow-api") {
        std::cout << "{\"service\":\"api\",\"text\":\"slow\",\"limit\":100}\n";
    } else if (key == "warnings") {
        std::cout << "{\"level\":\"warn\",\"limit\":100}\n";
    } else {
        std::cout << "{\"text\":\"" << key << "\",\"limit\":100}\n";
    }
}

void write_retention(const std::string& tier) {
    const std::string key = lower_copy(tier);
    int hot_days = 7;
    int warm_days = 30;
    if (key == "audit") {
        hot_days = 30;
        warm_days = 180;
    } else if (key == "debug") {
        hot_days = 2;
        warm_days = 7;
    } else if (key == "security") {
        hot_days = 14;
        warm_days = 90;
    }
    std::cout << "{\"tier\":\"" << key << "\",\"hot_days\":" << hot_days
              << ",\"warm_days\":" << warm_days << "}\n";
}

void write_route(const std::string& level) {
    const std::string key = lower_copy(level);
    std::string stream = "logs.default";
    if (key == "fatal" || key == "error") {
        stream = "logs.incidents";
    } else if (key == "warn") {
        stream = "logs.review";
    } else if (key == "debug" || key == "trace") {
        stream = "logs.low_cost";
    }
    std::cout << "{\"level\":\"" << key << "\",\"stream\":\"" << stream << "\"}\n";
}

void write_cost_hint(const std::string& level) {
    const std::string key = lower_copy(level);
    const std::string cost = key == "debug" || key == "trace" ? "low_cost" :
                             key == "error" || key == "fatal" ? "hot" : "standard";
    std::cout << "{\"level\":\"" << key << "\",\"cost_hint\":\"" << cost << "\"}\n";
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2 && argc != 3) return 2;
    if (argc == 3 && std::string(argv[1]) == "preset") {
        write_preset(argv[2]);
        return 0;
    }
    if (argc == 3 && std::string(argv[1]) == "retention") {
        write_retention(argv[2]);
        return 0;
    }
    if (argc == 3 && std::string(argv[1]) == "route") {
        write_route(argv[2]);
        return 0;
    }
    if (argc == 3 && std::string(argv[1]) == "cost") {
        write_cost_hint(argv[2]);
        return 0;
    }
    std::ostringstream buffer;
    buffer << std::cin.rdbuf();
    const std::string input = buffer.str();
    if (input.size() > MAX_MESSAGE_BYTES) return 3;
    if (argc == 3 && std::string(argv[1]) == "fields") {
        write_field_lines(input);
        return 0;
    }
    std::cout << normalize_level(argv[1], input) << "\n";
    return 0;
}
// Project version: LogForge V1.4




