#!/bin/bash

# Build frontend first
echo "Building frontend..."
cd frontend
rm -rf .parcel-cache dist
npm run render
npm run build
cd ..

# Start backend server
echo "Starting backend server..."
cd backend
poetry run python main.py
