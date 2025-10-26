[screen-capture (4).webm](https://github.com/user-attachments/assets/dfddd957-5c5c-450e-bdbe-309018f813c9)
#  codePlanner CLI

AI-powered planning layer for coding tasks

A sophisticated CLI tool that uses Google's Gemini AI to break down coding projects into manageable, trackable steps with detailed planning and progress management.

##  Commands

### **1. Create Plans** - `npm run cli create`

Generate AI-powered development plans from simple descriptions.

### **2. List Plans** - `npm run cli list`

Display all your coding plans with filtering and status.

## Filter by status

npm run cli list --status in-progress
npm run cli list --status completed
npm run cli list --status planning
npm run cli list --status paused

## Limit results

npm run cli list --limit 5

Use `npm run cli show <plan-id>` to view details
Use `npm run cli progress <plan-id>` to update progress

### **3. Show Plan Details** - `npm run cli show`

Display comprehensive information about a specific plan.

example - `npm run cli show react-todo-app-1234567890`

## Search by partial name

example-
`npm run cli show todo`
`npm run cli show react`

## Detailed Views

examples-
`npm run cli show react-todo-app-1234567890 --steps`
`npm run cli show react-todo-app-1234567890 --files`
`npm run cli show react-todo-app-1234567890 --dependencies`
`npm run cli show react-todo-app-1234567890 --steps --files --dependencies`

## Interactive step selection

`npm run cli progress react-todo-app-1234567890`

## Interactive plan selection

`npm run cli progress`

## Direct step completion

`npm run cli progress react-todo-app-1234567890 --step 4 --complete`

## Mark step as incomplete

`npm run cli progress react-todo-app-1234567890 --step 3 --incomplete`

## Show progress without updating

`npm run cli progress react-todo-app-1234567890 --show`

## Don't forget to have an api key from google AI studio and test before using which model is working
