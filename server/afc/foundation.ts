export type FoundationQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctOption: number
}

export type FoundationAssessment = {
  id: string
  courseId: string
  title: string
  durationMinutes: number
  passMark: number
  maxAttempts: number
  questions: FoundationQuestion[]
}

export const foundationAssessments: FoundationAssessment[] = [
  {
    id: 'foundation-python-programming', courseId: 'python-programming', title: 'Python programming foundation check', durationMinutes: 18, passMark: 70, maxAttempts: 2,
    questions: [
      { id: 'py-data-shape', prompt: 'Which collection is most appropriate when each value must be found by a unique label?', choices: ['A list', 'A dictionary', 'A set', 'A tuple only'], correctOption: 1 },
      { id: 'py-function-boundary', prompt: 'What is the clearest responsibility for a small function?', choices: ['Handle one well-defined task', 'Contain every step in a program', 'Avoid returning values', 'Only print messages'], correctOption: 0 },
      { id: 'py-input-validation', prompt: 'Why should an import script validate a row before using it?', choices: ['To make files larger', 'To detect bad or missing input before it affects output', 'To avoid using functions', 'To remove all error messages'], correctOption: 1 },
      { id: 'py-test-purpose', prompt: 'What does a useful automated test primarily protect against?', choices: ['A later change breaking expected behaviour', 'Users reading the source', 'The need for documentation', 'All runtime failures'], correctOption: 0 },
    ],
  },
  {
    id: 'foundation-machine-learning', courseId: 'machine-learning-with-python', title: 'Machine learning with Python foundation check', durationMinutes: 20, passMark: 70, maxAttempts: 2,
    questions: [
      { id: 'ml-split-purpose', prompt: 'Why should test data remain separate until a model is selected?', choices: ['It provides an unbiased final evaluation', 'It makes training slower', 'It removes all model risk', 'It replaces validation data'], correctOption: 0 },
      { id: 'ml-baseline', prompt: 'What is the value of a baseline model?', choices: ['It gives a reference that a more complex model should beat', 'It guarantees deployment approval', 'It removes the need for metrics', 'It changes missing values automatically'], correctOption: 0 },
      { id: 'ml-leakage', prompt: 'Which is an example of data leakage?', choices: ['Using future outcome information as a training feature', 'Documenting a preprocessing step', 'Keeping a test set aside', 'Comparing two metrics'], correctOption: 0 },
      { id: 'ml-model-card', prompt: 'A model card should clearly communicate which item?', choices: ['Intended use and limitations', 'A promise that all predictions are right', 'A learner password', 'Only the model file size'], correctOption: 0 },
    ],
  },
  {
    id: 'foundation-prompt-engineering', courseId: 'prompt-engineering', title: 'Prompt engineering foundation check', durationMinutes: 16, passMark: 70, maxAttempts: 2,
    questions: [
      { id: 'prompt-constraints', prompt: 'Which prompt element makes a response easier to review?', choices: ['Clear constraints and success criteria', 'An instruction to guess freely', 'A request for hidden reasoning', 'No context at all'], correctOption: 0 },
      { id: 'prompt-privacy', prompt: 'What should happen before adding client data to an AI prompt?', choices: ['Check whether it is sensitive and whether use is authorised', 'Post it publicly first', 'Remove the task goal', 'Assume all tools store nothing'], correctOption: 0 },
      { id: 'prompt-evaluation', prompt: 'What is a good reason to use an output rubric?', choices: ['To judge accuracy and usefulness consistently', 'To make every output identical', 'To skip human review', 'To reveal system instructions'], correctOption: 0 },
      { id: 'prompt-approval', prompt: 'Where should a human approval step sit in a customer-facing AI workflow?', choices: ['Before unreviewed output reaches the customer', 'Only after a complaint', 'Nowhere when the prompt is long', 'Inside a password field'], correctOption: 0 },
    ],
  },
  {
    id: 'foundation-full-stack', courseId: 'full-stack-development', title: 'Full stack development foundation check', durationMinutes: 20, passMark: 70, maxAttempts: 2,
    questions: [
      { id: 'fs-validation', prompt: 'Why must a server validate a client request even when the form validates it too?', choices: ['Clients can be bypassed or modified', 'Validation makes APIs invisible', 'Forms cannot display errors', 'Servers never receive user input'], correctOption: 0 },
      { id: 'fs-privacy', prompt: 'Which rule best protects one account from another account?', choices: ['Authorize access using the authenticated identity and record ownership', 'Hide the button in the interface', 'Use one shared account ID', 'Trust a user-provided owner field'], correctOption: 0 },
      { id: 'fs-contracts', prompt: 'What should a useful API error response provide?', choices: ['A clear status and safe explanation of the problem', 'A database password', 'An HTML screenshot only', 'No status code'], correctOption: 0 },
      { id: 'fs-release', prompt: 'What belongs in a deployment check?', choices: ['Required environment variables and key workflow verification', 'A learner answer key', 'Only a logo review', 'Deleting test evidence'], correctOption: 0 },
    ],
  },
  {
    id: 'foundation-software-development', courseId: 'software-development-foundations', title: 'Software development foundation check', durationMinutes: 18, passMark: 70, maxAttempts: 2,
    questions: [
      { id: 'sd-acceptance', prompt: 'What makes an acceptance criterion useful?', choices: ['It describes an observable outcome', 'It is a vague aspiration', 'It replaces user needs', 'It includes production secrets'], correctOption: 0 },
      { id: 'sd-commit', prompt: 'What is the main value of a focused commit message?', choices: ['It makes a change understandable and reviewable', 'It hides the changed files', 'It replaces tests', 'It prevents all merge conflicts'], correctOption: 0 },
      { id: 'sd-test-levels', prompt: 'Which check best verifies a critical workflow across the interface and server?', choices: ['An end-to-end test', 'A spelling check only', 'A color token only', 'A commit title only'], correctOption: 0 },
      { id: 'sd-secrets', prompt: 'Where should a production API secret be stored?', choices: ['A secure server environment variable', 'A public client bundle', 'A course discussion post', 'A screenshot in a repository'], correctOption: 0 },
    ],
  },
]
