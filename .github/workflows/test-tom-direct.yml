name: 🔍 Test Tom API Raw

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  test-tom-raw:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    
    steps:
    - name: 📥 Checkout
      uses: actions/checkout@v3
      
    - name: 🧪 Install jq
      run: sudo apt-get update && sudo apt-get install -y jq
      
    - name: 🚀 FETCH TOM API - COMPLETELY FRESH
      run: |
        echo "=== FRESH TOM API FETCH ==="
        echo "Using: https://topembed.pw/api.php?format=json"
        echo "NO worker, NO existing code"
        echo ""
        
        # 1. Fetch with curl - fresh
        echo "1️⃣ Fetching with curl..."
        curl -s "https://topembed.pw/api.php?format=json" > tom-fresh.json
        
        # 2. Check file
        echo "   File size: $(wc -c < tom-fresh.json) bytes"
        
        # 3. Basic JSON check
        echo ""
        echo "2️⃣ Basic JSON validation..."
        if jq empty tom-fresh.json 2>/dev/null; then
          echo "   ✅ Valid JSON"
        else
          echo "   ❌ Invalid JSON!"
          exit 1
        fi
        
        # 4. RAW analysis - NO processing
        echo ""
        echo "3️⃣ RAW DATA ANALYSIS (NO PROCESSING):"
        echo "   =" .repeat(40)
        
        # Get event keys directly
        EVENT_KEYS=$(jq -r '.events | keys[]' tom-fresh.json 2>/dev/null || echo "ERROR")
        
        echo "   Event keys found: $EVENT_KEYS"
        echo "   Number of keys: $(echo "$EVENT_KEYS" | wc -w)"
        
        # Check for "today"
        echo ""
        echo "4️⃣ CHECKING FOR 'today':"
        if echo "$EVENT_KEYS" | grep -q "today"; then
          echo "   ❌ Found 'today' in raw API!"
        else
          echo "   ✅ No 'today' in raw API"
        fi
        
        # Check for date strings
        echo ""
        echo "5️⃣ CHECKING FOR DATE STRINGS (YYYY-MM-DD):"
        DATE_COUNT=$(echo "$EVENT_KEYS" | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | wc -l)
        echo "   Date strings found: $DATE_COUNT"
        
        # Show each date with match count
        echo ""
        echo "6️⃣ MATCHES PER DATE:"
        jq -r '.events | to_entries[] | "   \(.key): \(.value | length) matches"' tom-fresh.json 2>/dev/null || echo "   Could not parse"
        
        # Total matches
        echo ""
        echo "7️⃣ TOTAL MATCHES:"
        TOTAL=$(jq '[.events[] | length] | add' tom-fresh.json 2>/dev/null || echo "0")
        echo "   Total: $TOTAL"
        
        # 5. Save results
        echo ""
        echo "8️⃣ SAVING RESULTS..."
        echo "$EVENT_KEYS" > event-keys.txt
        echo "TOTAL: $TOTAL" >> event-keys.txt
        
        # Create simple report
        cat > report.txt << EOF
        TOM API RAW FETCH REPORT
        =========================
        Timestamp: $(date)
        API URL: https://topembed.pw/api.php?format=json
        
        EVENT KEYS:
        $(echo "$EVENT_KEYS" | sed 's/^/  /')
        
        MATCH COUNTS:
        $(jq -r '.events | to_entries[] | "  \(.key): \(.value | length) matches"' tom-fresh.json 2>/dev/null || echo "  Could not parse")
        
        TOTAL MATCHES: $TOTAL
        
        CONCLUSION:
        $(if echo "$EVENT_KEYS" | grep -q "today"; then echo "  ❌ API returns 'today' (API changed)"; else echo "  ✅ API returns date strings (API unchanged)"; fi)
        EOF
        
        echo "✅ Report saved: report.txt"
        
        # 6. Compare with existing test-tom-data.json if it exists
        echo ""
        echo "9️⃣ COMPARING WITH EXISTING TEST DATA..."
        if [ -f "test-tom-data.json" ]; then
          echo "   Found test-tom-data.json"
          EXISTING_KEYS=$(jq -r '.events | keys[]' test-tom-data.json 2>/dev/null || echo "NONE")
          echo "   Existing keys: $EXISTING_KEYS"
          
          if [ "$EVENT_KEYS" = "$EXISTING_KEYS" ]; then
            echo "   ✅ Keys match!"
          else
            echo "   ❌ Keys don't match!"
            echo "   Fresh: $EVENT_KEYS"
            echo "   Existing: $EXISTING_KEYS"
          fi
        else
          echo "   No test-tom-data.json found"
        fi
