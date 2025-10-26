export function generatePlanId(title: string): string {
  // Convert title to kebab-case and add timestamp
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .slice(0, 30);                // Limit length
  
  const timestamp = Date.now();
  return `${slug}-${timestamp}`;
}

export function generateStepId(stepNumber: number): string {
  return `step-${stepNumber}`;
}
