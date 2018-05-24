const { browserStackErrorReporter } = requireHelper('browserstack-error-reporter');
const utils = requireHelper('e2e-utils');
const config = requireHelper('e2e-config');
requireHelper('rejection');
const axePageObjects = requireHelper('axe-page-objects');

jasmine.getEnv().addReporter(browserStackErrorReporter);

const clickTabTest = async (index, tabName) => {
  const tabElTrigger = await element.all(by.className('tab')).get(index);
  await tabElTrigger.click();
  await browser.driver.actions().mouseMove(tabElTrigger).mouseMove({ x: 0, y: 40 }).perform();
  await browser.driver
    .wait(protractor.ExpectedConditions.visibilityOf(element(by.css(`#${tabName}.is-visible`))), config.waitsFor);

  expect(await element(by.id(tabName)).getAttribute('class')).toContain('can-show');
  expect(await element.all(by.className('tab')).get(index).getAttribute('class')).toContain('is-selected');
};

describe('Tabs init example-modal tests', () => {
  beforeEach(async () => {
    await utils.setPage('/components/tabs/example-index');
    const tabsEl = await element(by.id('tabs-normal'));
    await browser.driver
      .wait(protractor.ExpectedConditions.presenceOf(tabsEl), config.waitsFor);
  });

  if (!utils.isIE()) {
    xit('Should be accessible on init with no WCAG 2AA violations on example-index', async () => {
      const res = await axePageObjects(browser.params.theme);

      expect(res.violations.length).toEqual(0);
    });
  }

  it('Should open 5th tab, on click', async () => {
    await clickTabTest('4', 'tabs-normal-notes');
  });

  it('Should open 5th tab, 3rd, then 2nd tab, on click screen width of 500px', async () => {
    const windowSize = await browser.driver.manage().window().getSize();
    await browser.driver.manage().window().setSize(500, 600);
    await clickTabTest('4', 'tabs-normal-notes');
    await clickTabTest('2', 'tabs-normal-attachments');
    await clickTabTest('1', 'tabs-normal-opportunities');
    await browser.driver.manage().window().setSize(windowSize.width, windowSize.height);
  });

  it('Should open 5th tab, open menu tab-popupmenu, and list correct tab on screen width of 500px', async () => {
    const windowSize = await browser.driver.manage().window().getSize();
    await browser.driver.manage().window().setSize(500, 600);
    await clickTabTest('4', 'tabs-normal-notes');
    await element(by.className('tab-more')).click();
    await browser.driver
      .wait(protractor.ExpectedConditions.visibilityOf(element(by.css('.tab-more.is-open'))), config.waitsFor);

    expect(await element.all(by.css('#tab-container-popupmenu li')).get(4).getAttribute('class')).toContain('is-checked');
    await browser.driver.manage().window().setSize(windowSize.width, windowSize.height);
  });

  it('Should open 5th, 3rd, then 2nd tab, on click', async () => {
    await clickTabTest('4', 'tabs-normal-notes');
    await clickTabTest('2', 'tabs-normal-attachments');
    await clickTabTest('1', 'tabs-normal-opportunities');
  });
});
