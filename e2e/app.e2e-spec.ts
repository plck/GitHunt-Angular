import { TestXPage } from './app.po';

describe('test-x App', () => {
  let page: TestXPage;

  beforeEach(() => {
    page = new TestXPage();
  });

  it('should display welcome message', done => {
    page.navigateTo();
    page.getParagraphText()
      .then(msg => expect(msg).toEqual('Welcome to app!!'))
      .then(done, done.fail);
  });
});
