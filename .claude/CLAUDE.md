# Claude Development Guidelines

## Core Principles

### 1. Think Before Acting
- **Always read relevant files** before making claims or changes
- Investigate the codebase thoroughly - never speculate about code you haven't opened
- If the user references a specific file, you MUST read it before answering
- Give grounded, hallucination-free answers based on actual code

### 2. Check In Before Major Changes
- Present your plan and get approval before implementing significant modifications
- Define "major" as: architectural changes, refactoring multiple files, changing public APIs, or modifying core logic
- Small bug fixes and minor improvements can proceed without checkpoint

### 3. Simplicity Above All
- Make every task and code change as simple as possible
- Impact as little code as possible with each change
- Avoid massive or complex changes - break them into smaller steps
- If there's a simple solution and a complex solution, always choose simple

### 4. High-Level Communication
- Provide high-level explanations of changes at each step
- Don't overwhelm with implementation details unless asked
- Focus on: what changed, why it changed, and impact on the system

## Workflow

### Investigation Phase
1. Read all relevant files mentioned or implied by the request
2. Understand the current implementation
3. Identify dependencies and potential impacts
4. Map out the change in your mind

### Planning Phase
1. Propose approach in simple terms
2. Get user approval for major changes
3. Confirm understanding before proceeding

### Implementation Phase
1. Make minimal changes to achieve the goal
2. Maintain existing patterns and conventions
3. Add clear comments for complex logic
4. Update documentation as you go

### Verification Phase
1. **Test changes before considering them complete**
2. Verify existing functionality still works
3. Check edge cases
4. Confirm the change solves the original problem

## Project-Specific Context

### Technology Stack
This guideline applies to multiple project types:
- **.NET/C# Projects** (Revit add-ins, desktop applications)
- **Python Projects** (automation scripts, data processing)
- **Web Technologies** (StructuralFlow and related web apps)

### Critical Rule: Don't Break Existing Functionality
- Always verify that your changes don't break existing features
- Test related functionality after making changes
- When in doubt, ask before modifying working code
- Regression prevention is a top priority

## Documentation Requirements

### Maintain Architecture Documentation
- Keep a running documentation file that describes how the application works
- Update architectural docs when making structural changes
- Document key design decisions and rationale
- Include diagrams or explanations of complex subsystems

### Code Comments
- Add comments for non-obvious logic
- Explain "why" not just "what"
- Update existing comments when changing code
- Remove outdated comments

## Code Quality Standards

### For .NET/C# Projects
- Follow C# naming conventions (PascalCase for public members, camelCase for private)
- Use meaningful variable and method names
- Prefer explicit over implicit when clarity is gained
- Handle exceptions appropriately

### For Python Projects
- Follow PEP 8 style guidelines
- Use type hints where they add clarity
- Keep functions focused and single-purpose
- Use meaningful variable names

### For Web Projects
- Follow established patterns in the codebase
- Maintain separation of concerns
- Keep components small and focused
- Test in relevant browsers/environments when applicable

## Common Patterns to Follow

### Error Handling
- Always handle potential errors gracefully
- Provide meaningful error messages
- Log errors appropriately for debugging
- Don't silently swallow exceptions

### Testing
- Test happy path and edge cases
- Verify changes work in realistic scenarios
- Check integration points with other systems
- Manual testing required before marking complete

### Refactoring
- Refactor in small, safe steps
- Maintain backward compatibility unless explicitly changing API
- Test after each refactoring step
- Don't mix refactoring with feature additions

## Red Flags to Watch For

### Never Do These Without Explicit Permission
- Changing public APIs or interfaces
- Modifying core business logic without full understanding
- Large-scale refactoring across multiple files
- Adding new dependencies or frameworks
- Changing database schemas or data structures

### Always Ask About
- Performance implications of changes
- Security considerations
- Scalability concerns
- Breaking changes to existing functionality

## Questions to Ask Yourself

Before implementing any change:
1. Have I read all relevant code?
2. Do I fully understand the current implementation?
3. Is this the simplest solution?
4. Will this break existing functionality?
5. Have I tested this change?
6. Is the documentation updated?
7. Does this follow existing patterns?

## Summary

**The Golden Rules:**
1. Investigate first, speculate never
2. Check in before major changes
3. Keep it simple
4. Test before completion
5. Maintain documentation
6. Don't break existing functionality
