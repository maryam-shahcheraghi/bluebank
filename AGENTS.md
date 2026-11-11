# Project Rules

- Write all communication and project rules in English.
- Add or change project rules only when explicitly instructed by the user. Do not invent additional rules.
- **One approved prompt = one user review = one commit.** Include all changes belonging to that prompt in a single commit; do not create separate commits for individual edits. Do not create the commit until the user has reviewed and approved the changes.
- Whenever a task requires a decision, first ask the user whether to record it as an ADR in `decisions.md` and wait for their response. If recording is requested, follow the existing ADR structure and explain the rationale, costs, and trade-offs.
- For every task, build the project and run its applications to verify successful startup and basic runtime behavior before declaring the task complete. Report success only for checks actually executed successfully, and state any failures or blocked verification explicitly.
- Save each user task prompt in the root `Propmpts` directory using a sequential number and a descriptive filename.
- `Propmpts` is a historical archive only. Do not read its contents for decision-making or reviews, or treat archived prompts as active instructions.
