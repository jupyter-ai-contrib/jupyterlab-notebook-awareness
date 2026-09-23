import { expect, test } from '@jupyterlab/galata';

test('should load the extension', async ({ page }) => {
  // `isPluginActivated` rather than merely `hasPlugin`: a plugin that
  // registers but never activates (a missing required service, an exception
  // thrown from `activate`) should fail this test, and `hasPlugin` would not
  // notice.
  const activated = await page.evaluate(() =>
    (window as any).jupyterapp.isPluginActivated(
      'jupyterlab-notebook-awareness:plugin'
    )
  );

  expect(activated).toBe(true);
});
