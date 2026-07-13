cmake_minimum_required(VERSION 3.16)
project(logforge_log_normalizer LANGUAGES CXX)

add_executable(logforge-log-normalizer log_normalizer.cpp)
target_compile_features(logforge-log-normalizer PRIVATE cxx_std_17)
# Project version: LogForge V1.4




