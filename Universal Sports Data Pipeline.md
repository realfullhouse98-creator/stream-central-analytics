🏆 Universal Sports Data Pipeline

🚀 Overview

A scalable, automated pipeline that processes sports streaming data from multiple suppliers into a unified, clean format. The system automatically fetches, standardizes, merges, and delivers sports match data with streaming links.

📁 Complete File Structure

🗂️ Root Directory

text
/
├── 🔄 universal-update.yml          # GitHub Actions workflow (main pipeline)
├── 📊 master-data.json              # FINAL OUTPUT: Clean, merged sports data
├── 🏗️ standardization-UNIVERSAL.json # Phase 1 output: Standardized supplier data
└── 📚 README.md                     # This documentation
🔧 Scripts Directory (/scripts/)

text
/scripts/
├── 🔄 update-suppliers.js           # Fetches fresh data from all APIs
├── 🏗️ universal-standardizer.js     # Phase 1: Standardizes all supplier data
├── 🎯 phase2-processor.js           # Phase 2: Merges duplicates & creates master
└── 🧪 test-suppliers.js             # Testing utility
📦 Suppliers Directory (/suppliers/)

text
/suppliers/
├── 🔄 update-results.json           # Update status & metrics
├── 📥 tom-data.json                 # Raw data from Tom API
├── 📥 sarah-data.json               # Raw data from Sarah API  
├── 📥 wendy-data.json               # Raw data from Wendy API
└── 📂 backups/                      # Auto-managed backups (24hr retention)
    ├── tom-data-1764161975295.json
    ├── sarah-data-1764161974314.json
    └── wendy-data-1764148624101.json
🧩 Modules Directory (/modules/)

text
/modules/
└── 🗺️ normalization-map.js          # Universal field mapping & sports classification
🔄 Pipeline Flow

Step 1: Data Collection

File: update-suppliers.js

Fetches from 3 suppliers: Tom, Sarah, Wendy
Circuit Breakers prevent API spam during failures
Auto-backup before each update
Auto-recovery uses backups if APIs fail
24-hour cleanup deletes old backups automatically
Step 2: Phase 1 - Standardization

File: universal-standardizer.js

Input: Raw supplier data (tom-data.json, sarah-data.json, wendy-data.json)
Process: Converts all data to common format using normalization-map.js
Output: standardization-UNIVERSAL.json (2346 matches)
Step 3: Phase 2 - Advanced Processing

File: phase2-processor.js

Input: Standardized data from Phase 1
Process: Smart merging, deduplication, stream consolidation
Output: master-data.json (1504 matches - 36% compression)
🎯 Master Data Structure

Clean, Minimal Format:

javascript
{
  "unix_timestamp": 1764161975,      // Standardized time
  "sport": "Basketball",             // Classified sport name
  "tournament": "NBA",               // League/tournament
  "match": "Lakers vs Celtics",      // Standard team format
  "sources": {                       // Streams organized by supplier
    "tom": ["https://topembed.pw/..."],
    "sarah": ["https://embedsports.top/..."],
    "wendy": ["https://spiderembed.top/..."]
  },
  "confidence": 0.8,                 // Merge confidence score
  "merged": true,                    // Whether match was merged
  "merged_count": 3                  // Number of sources merged
}
🧠 Smart Features

🔍 Field Normalization

File: normalization-map.js

Universal Mapping: Handles 20+ field name variations automatically
Sport Classification: 50+ sports with intelligent detection
Team Formatting: Converts all to "Team A vs Team B" format
Timestamp Standardization: Handles multiple time formats
🤝 Intelligent Merging

Low Thresholds: Merges at 20-25% similarity (aggressive deduplication)
Cross-Supplier: Combines matches from Tom + Sarah + Wendy
Stream Consolidation: Preserves all unique streaming links
Quality Preservation: Maintains source attribution
🛡️ Resilience Features

Circuit Breakers: Prevents API spam during outages
Auto-Backup: Creates backups before each update
Auto-Recovery: Restores from backup if APIs fail
24-hour Cleanup: Prevents repository bloat
🚀 GitHub Actions Pipeline

File: universal-update.yml

yaml
name: 🔄 Universal Data Pipeline
on:
  schedule:
    - cron: '*/60 * * * *'  # Every 60 minutes
  workflow_dispatch:        # Manual trigger

jobs:
  universal-pipeline:
    steps:
      - 📥 Checkout
      - 🔄 Update Suppliers      # update-suppliers.js
      - 🏗️ Phase 1 Standardization # universal-standardizer.js  
      - 🎯 Phase 2 Processing    # phase2-processor.js
      - ✅ Verify Output
      - 📝 Commit Results
📊 Performance Metrics

Typical Results:

Input: 2,300+ raw matches from suppliers
Output: 1,500+ clean matches (36% compression)
Processing: < 10 seconds
Memory: < 10MB
Wendy Integration: 200-500 streams included
🎯 Adding New Suppliers

Simple 2-Step Process:

Add to supplier config:
javascript
// In update-suppliers.js
{
  name: 'newsupplier',
  urls: ['https://api.newsupplier.com/data'],
  processor: (data) => { /* conversion logic */ }
}
Field mapping happens automatically via normalization-map.js
No code changes needed! The universal system auto-detects field names.

🔧 Key Technologies

Node.js - Runtime environment
GitHub Actions - Automation & scheduling
Circuit Breaker Pattern - API resilience
Field Normalization - Universal data mapping
Fuzzy Matching - Intelligent deduplication
🎉 Benefits

Scalable: Ready for 20+ suppliers without code changes
Resilient: Auto-recovery from API failures
Efficient: 36% data compression through smart merging
Clean: Minimal, well-structured output
Fast: Complete pipeline in under 10 seconds
Maintainable: Clear separation of concerns
🚀 The universal sports data pipeline is production-ready and scaling beautifully!
