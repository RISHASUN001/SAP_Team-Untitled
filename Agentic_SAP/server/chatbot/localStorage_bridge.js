
// Run this in browser console to extract Alex's feedback:
// Step 1: Open browser developer tools (F12)
// Step 2: Go to Application > Local Storage
// Step 3: Look for 'teamFeedback' key
// Step 4: Run this code:

console.log("=== ALEX RODRIGUEZ FEEDBACK DATA ===");
const feedbackData = localStorage.getItem('teamFeedback');
if (feedbackData) {
    const allFeedback = JSON.parse(feedbackData);
    const alexFeedback = allFeedback.filter(fb => 
        fb.userId === 'tm001' || 
        fb.teamMemberId === 'tm001' || 
        fb.name?.includes('Alex') ||
        fb.managerName?.includes('Alex')
    );
    
    console.log("Alex's Feedback:");
    console.log(JSON.stringify(alexFeedback, null, 2));
    
    if (alexFeedback.length === 0) {
        console.log("No feedback found for Alex (tm001)");
        console.log("All feedback users:", 
            allFeedback.map(fb => ({ 
                id: fb.userId || fb.teamMemberId, 
                name: fb.name || 'unknown' 
            }))
        );
    }
} else {
    console.log("No feedback data in localStorage");
}
