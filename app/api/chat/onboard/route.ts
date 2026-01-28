

const PROMPT_TURN_1 = 'What brings you to Rebind?';

const OPTIONS_TURN_1 = [
    'What is Rebind?',
    'Reading the Bible',
    'Using a Bible Reading Plan',
    'I want to chat with AI while I read',
    'I want deeper intellectual content',
    'I want to listen to classic books',
    'I’m not really sure yet',
    'Something else',
];

const responseBody = () => ({
    prompt: PROMPT_TURN_1,
    options: OPTIONS_TURN_1,
});

export async function GET() {
    return new Response(JSON.stringify(responseBody()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST() {
    return new Response(JSON.stringify(responseBody()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}