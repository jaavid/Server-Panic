import { test, expect } from '@playwright/test';

test('menu tutorial gameplay score cooling and restart',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('SERVERPANIC!')).toBeVisible();
  await page.getByRole('button',{name:/چطور بازی کنم/}).click();
  await expect(page.getByText('قبل از بحران،')).toBeVisible();
  await page.getByRole('button',{name:/فهمیدم/}).click();
  await expect(page.locator('#panel-menu')).toBeHidden();
  await expect(page.locator('#queue-count')).toHaveText('2/9');
  await page.locator('[data-action="rack0"]').click();
  await expect.poll(async()=> Number((await page.locator('#hud-score').innerText()).replaceAll(',',''))).toBeGreaterThanOrEqual(100);
  await page.locator('#cool-button').click();
  await expect(page.locator('#stage-label')).toContainText('حالت خنک‌سازی');
  await page.locator('[data-action="rack0"]').click();
  await expect(page.locator('#cool-button')).toBeDisabled();
  expect(errors).toEqual([]);
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth+2)).toBeTruthy();
});

test('local storage is allowed on real HTTP origin',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>localStorage.setItem('server-panic:best-score:v1','1234'));
  await page.reload();
  await expect(page.locator('#best-menu')).toHaveText('1,234');
});
