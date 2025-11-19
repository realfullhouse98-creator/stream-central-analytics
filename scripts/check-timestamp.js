function checkTimestamp() {
    const timestamp = 1763510400;
    console.log('🔍 ANALYZING TIMESTAMP: 1763510400\n');
    
    const date = new Date(timestamp * 1000);
    
    console.log('CONVERSION RESULTS:');
    console.log(`toISOString(): ${date.toISOString()}`);
    console.log(`toTimeString(): ${date.toTimeString()}`);
    console.log(`getHours(): ${date.getHours()}`);
    console.log(`getMinutes(): ${date.getMinutes()}`);
    console.log(`getFullYear(): ${date.getFullYear()}`);
    console.log(`Valid date?: ${!isNaN(date.getTime())}`);
    
    // Check if it's in the past
    const now = new Date();
    console.log(`Is in past?: ${date < now}`);
}

checkTimestamp();
