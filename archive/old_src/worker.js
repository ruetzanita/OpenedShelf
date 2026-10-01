export default {
    async fetch(request, env, ctx) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coming Soon | OpenedShelf</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐇</text></svg>">
    <style>
        :root {
            --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
            --text-color: #1a1a1a;
            --bg-color: #fdfdfc;
            --border-color: #e5e5e5;
            --primary-color: #D03D29;
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 0;
        }
        a {
            color: var(--primary-color);
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div style="max-width: 600px; margin: 4rem auto; text-align: center; font-family: var(--font-sans); line-height: 1.8; padding: 2rem;">
        <img src="/rabbithole.png" alt="Rabbit reading" style="width: 150px; margin-bottom: 2rem; border-radius: 50%;" />
        <h1 style="font-family: var(--font-serif); font-size: 2.5rem; margin-bottom: 1rem;">Coming Soon</h1>
        <p style="font-size: 1.2rem; color: var(--text-color); opacity: 0.9; margin-bottom: 2rem;">
            The OpenedShelf beta is just around the corner. We are currently finalizing the archive and setting up the shelves.
        </p>
        <p style="font-style: italic; opacity: 0.8;">
            Have questions or want early access? Reach out to us at <a href="mailto:rabbit@openedshelf.org">rabbit@openedshelf.org</a>
        </p>
    </div>
</body>
</html>`;

        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }
};
