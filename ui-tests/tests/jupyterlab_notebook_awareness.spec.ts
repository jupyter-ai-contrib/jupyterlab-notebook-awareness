import { expect, test } from '@jupyterlab/galata';

test('should load the extension', async ({ page }) => {
  // Check that the extension plugin is registered
  const plugins = await page.evaluate(() => {
    return Array.from(
      (window as any).jupyterapp.serviceManager.builder?.registeredPlugins || []
    );
  });

  expect(
    plugins.some(
      (plugin: any) =>
        plugin === 'jupyterlab-notebook-awareness:plugin' ||
        plugin?.id === 'jupyterlab-notebook-awareness:plugin'
    )
  ).toBeTruthy();
});
