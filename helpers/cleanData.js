

export const cleanData = async () => { 
	var sessionId;

    async function getUrl() {
      return await page.goto('/');
    }

    async function getUserName() {
      return process.env.LOCAL_USERNAME;
    }

    async function getPassword() {
      return process.env.LOCAL_PASSWORD;
    }

    async function getCrumbFromPage(page) {
      const CRUMB_TAG = 'data-crumb-value="';

      let crumbTagBeginIndex = await page.indexOf(CRUMB_TAG) + CRUMB_TAG.length;
      let crumbTagEndIndex = await page.indexOf('"', crumbTagBeginIndex);

      return await page.substring(crumbTagBeginIndex, crumbTagEndIndex);
    }

    async function getSubstringsFromPage(page, from, to, maxSubstringLength = 100) {
      let result = new Set();

      let index = await page.indexOf(from);
      while (index != -1) {
        let endIndex = await page.indexOf(to, index + from.length);

        if (endIndex != -1 && endIndex - index < maxSubstringLength) {
          result.add(await page.substring(index + from.length, endIndex));
        } else {
          endIndex = index + from.length;
        }

        index = await page.indexOf(from, endIndex);
      }

      return result;
    }

    async function setHeader(request) {
      await request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      if (sessionId != null) {
        await request.setRequestHeader('Cookie', sessionId);
      }
    }

    async function sendHttp(url, type, body) {
      let http = new XMLHttpRequest();
      http.open(type, url, false);
      await setHeader(http);
      http.send(body);

      return http;
    }

    async function getHttp(url) {
      return await sendHttp(url, 'GET', null);
    }

    async function postHttp(url, body) {
      return await sendHttp(url, 'POST', body);
    }

    async function getPage(uri) {
      let page = await getHttp(getUrl() + uri);
      if (page.status != 200) {
        const HEAD_COOKIE = 'set-cookie';

        let loginPage = await getHttp(getUrl() + 'login?from=%2F');
        sessionId = loginPage.getResponseHeader(HEAD_COOKIE);

        let indexPage = await postHttp(getUrl() + 'j_spring_security_check',
          'j_username=' + getUserName() + '&j_password=' + getPassword() + '&from=%2F&Submit=');
        sessionId = indexPage.getResponseHeader(HEAD_COOKIE);

        page = await getHttp(getUrl() + uri);
      }
      
      if (page.status == 403) {
        //throw new RuntimeException(String.format("Authorization does not work with user: \"%s\" and password: \"%s\"", getUserName(), getPassword()));
      } else if (page.status != 200) {
        //throw new RuntimeException("Something went wrong while clearing data");
      }

      return page.responseText;
    }

    async function deleteByLink(link, names, crumb) {
      let fullCrumb = `Jenkins-Crumb=${crumb}`;
      for (const name of names) {
        await postHttp((getUrl() + link).replace('{name}', name), fullCrumb);
      }
    }

    async function deleteJobs() {
      let mainPage = await getPage('');
      await deleteByLink('job/{name}/doDelete',
        getSubstringsFromPage(mainPage, 'href="job/', '/"'),
        getCrumbFromPage(mainPage));
    }

    async function deleteViews() {
      let mainPage = await getPage(''); 
      await deleteByLink('view/{name}/doDelete',
        getSubstringsFromPage(mainPage, 'href="/view/', '/"'),
        getCrumbFromPage(mainPage));

      let viewPage = await getPage('me/my-views/view/all/');
      await deleteByLink(`user/${getUserName().toLowerCase()}/my-views/view/{name}/doDelete`,
        getSubstringsFromPage(viewPage, `href="/user/${getUserName().toLowerCase()}/my-views/view/`, '/"'),
        getCrumbFromPage(viewPage));
    }

    async function deleteUsers() {
      let userPage = await getPage('manage/securityRealm/');
      let users = await getSubstringsFromPage(userPage, 'href="user/', '/"');
      users.delete(getUserName().toLowerCase());
      await deleteByLink('manage/securityRealm/user/{name}/doDelete',
        users,
        getCrumbFromPage(userPage));
    }

    async function deleteNodes() {
      let mainPage = await getPage('');
      await deleteByLink('computer/{name}/doDelete',
        getSubstringsFromPage(mainPage, 'href="/computer/', '/"'),
        getCrumbFromPage(mainPage));
    }

    async function deleteDescription() {
      let mainPage = await getPage('');
      await postHttp(getUrl() + "submitDescription", 
        "description=&Submit=&Jenkins-Crumb=" + getCrumbFromPage(mainPage) + "&json=%7B%22description%22%3A+%22%22%2C+%22Submit%22%3A+%22%22%2C+%22Jenkins-Crumb%22%3A+%22" + getCrumbFromPage(mainPage) + "%22%7D");
    }

    async function clearData() {
      await deleteViews();
      await deleteJobs();
      await deleteUsers();
      await deleteNodes();
      await deleteDescription();
    }

    await clearData();
}