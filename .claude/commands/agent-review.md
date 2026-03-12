# Agent Review

AI-powered database entry reviewer that researches and updates YAML entries.

## Usage

```
/agent-review                     # Review random old entry
/agent-review controllers         # Review entry from specific category
/agent-review controllers/wled    # Review specific entry
```

## Workflow

When this skill is invoked:

1. **Run the selection script** to pick an entry and generate context:

   ```bash
   bun run agent-review $ARGUMENTS
   ```

2. **Read the generated report** from `database/issues/{entry-id}-review.txt`

3. **Research the product** using the search queries from the report:
   - Use WebSearch for each query listed
   - Use WebFetch to check any URLs that need verification

4. **Analyze findings** and determine what changes are needed:
   - Compare current entry data with research results
   - Check if URLs are still valid or need updating
   - Verify product availability and pricing
   - Identify missing fields that should be added

5. **Apply changes** based on confidence level:

   **Auto-commit (HIGH confidence):**
   - Removing confirmed dead URLs
   - Updating redirected URLs to new location
   - Setting status to "discontinued" when confirmed by multiple sources

   **Propose for review (MEDIUM/LOW confidence):**
   - Price changes
   - Adding new fields
   - Major content updates
   - Unverified information

6. **Generate commit message** following the pattern:
   ```
   Update {entry-name}: {brief description of changes}
   ```

## Categories

Available categories:

- controllers
- pixels
- pixel-ics
- pattern-drivers
- connectors
- microboards
- level-converters
- adapters
- drive-libraries
- pixel-decoders
- diffusive-materials
- commercial-systems

## Report Location

Reports are saved to `database/issues/{entry-id}-review.txt` for reference.
