#!/bin/bash

# Ephemeral Canvas - Quick Installation Script
# This script sets up the Next.js project with all dependencies

set -e  # Exit on error

echo "🎨 Ephemeral Canvas - Installation Script"
echo "========================================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local file found"
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo ""
    echo "🔑 IMPORTANT: Edit .env.local with your Supabase credentials!"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Copy your Project URL and anon key"
    echo "   3. Update .env.local with these values"
    echo ""
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Complete Supabase setup (see SETUP.md)"
echo "2. Update .env.local with your credentials"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "📚 Full setup guide: ./SETUP.md"
echo ""
