#!/bin/bash
cd frontend
rm -rf .parcel-cache dist
npm run render
npm run dev
