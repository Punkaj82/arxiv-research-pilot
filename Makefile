# Makefile for ArXiv Research Pilot - C/C++ Servers

# Compiler settings
CC = gcc
CXX = g++
CFLAGS = -Wall -Wextra -std=c99 -O2
CXXFLAGS = -Wall -Wextra -std=c++17 -O2

# Libraries
CURL_LIBS = -lcurl
JSON_LIBS = -lcjson
CXX_LIBS = -lcurl

# Targets
all: server_c server_cpp server_py

# C Server
server_c: server.c
	$(CC) $(CFLAGS) -o server_c server.c $(CURL_LIBS) $(JSON_LIBS)

# C++ Server
server_cpp: server.cpp
	$(CXX) $(CXXFLAGS) -o server_cpp server.cpp $(CXX_LIBS)

# Python Server (install dependencies)
server_py: requirements.txt
	pip3 install -r requirements.txt

# Install system dependencies (Ubuntu/Debian)
install-deps:
	sudo apt-get update
	sudo apt-get install -y \
		build-essential \
		libcurl4-openssl-dev \
		libcjson-dev \
		python3 \
		python3-pip \
		python3-flask \
		python3-requests

# Install Python dependencies
requirements.txt:
	echo "flask==2.3.3" > requirements.txt
	echo "flask-cors==4.0.0" >> requirements.txt
	echo "requests==2.31.0" >> requirements.txt

# Clean build files
clean:
	rm -f server_c server_cpp
	rm -f *.o
	rm -rf __pycache__
	rm -f requirements.txt

# Run servers
run-c: server_c
	./server_c

run-cpp: server_cpp
	./server_cpp

run-py: server_py
	python3 server.py

run-node: 
	node server.js

# Test all servers
test-all: install-deps all
	@echo "Testing C server..."
	@timeout 5s ./server_c || true
	@echo "Testing C++ server..."
	@timeout 5s ./server_cpp || true
	@echo "Testing Python server..."
	@timeout 5s python3 server.py || true
	@echo "Testing Node.js server..."
	@timeout 5s node server.js || true

# Help
help:
	@echo "Available targets:"
	@echo "  run-node     - Run Node.js server"
	@echo "  help         - Show this help"

.PHONY: run-node help 