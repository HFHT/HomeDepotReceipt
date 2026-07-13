# Home Depot Receipt Receipt Submission 

## Todo
Step 3
Change error handling, first do images then the mongo meta data, if an image fails then have a modal popup and allow retry or allow to bypass with warning to provide the hardcopy receipts to finance, if mongo upload fails then do not clear the form.

Step 2
Change text on button to "Continue To Review" if the the response is not failed and the user hasn't modified any of the files. If a file is modified or deleted then set button text back to "Analyze & Continue"

If the returned receipt number and receipt date is in the history then flag but allow the user to continue anyway. 

Step 1
Persist the Member object in localStorage and load it from there if it exists (remember the submitter). 
After leaving and coming back, the Member object is lost so a blank user is saved to Mongo DB.

Some project / subdivision don't require Phases

Prompt
Check the new prompt
- only show discount at the receipt level, remove it from the line items. 
- receipt_date only YYYY-MM-DD
- Look for Balance Due

Image resize
Check the image resize. 


Important: retrofit the new ReceiptAnalysisResponse from HomeDepotReview