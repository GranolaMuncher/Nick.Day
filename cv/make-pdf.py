import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        pg = await b.new_page()
        await pg.goto('file://' + __import__('os').path.abspath('cv/cv.html') + '')
        await pg.pdf(path='public/files/Nicholas-Day-CV.pdf', format='Letter', print_background=True, prefer_css_page_size=True)
        await b.close()
asyncio.run(main())
