const HOST = process.env.LOCAL_HOST;
const PORT = process.env.LOCAL_PORT;
const USERNAME = process.env.LOCAL_USERNAME;

export async function cleanData(request) {
  const baseUrl = `http://${HOST}:${PORT}/`;

  function getCrumbFromPage(html) {
    const CRUMB_TAG = 'data-crumb-value="';
    const begin = html.indexOf(CRUMB_TAG) + CRUMB_TAG.length;
    const end = html.indexOf('"', begin);
    return html.substring(begin, end);
  }

  function getSubstringsFromPage(html, from, to, maxLength = 100) {
    const result = new Set();
    let index = html.indexOf(from);
    while (index !== -1) {
      let endIndex = html.indexOf(to, index + from.length);
      if (endIndex !== -1 && endIndex - index < maxLength) {
        result.add(html.substring(index + from.length, endIndex));
      } else {
        endIndex = index + from.length;
      }
      index = html.indexOf(from, endIndex);
    }
    return result;
  }

  async function getPage(uri = '') {
    const res = await request.get(`${baseUrl}${uri}`);
    if (res.status() !== 200) {
      throw new Error(`GET ${uri} failed with status ${res.status()}`);
    }
    return await res.text();
  }

  async function postPage(uri, body, crumb = null) {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (crumb) {
      headers['Jenkins-Crumb'] = crumb;
    }

    const res = await request.post(`${baseUrl}${uri}`, {
      headers,
      body,
    });

    if (res.status() !== 200) {
      throw new Error(`POST ${uri} failed with status ${res.status()}`);
    }

    return res;
  }

  async function deleteByLink(link, names, crumb) {
    const fullCrumb = `Jenkins-Crumb=${crumb}`;
    for (const name of names) {
      await postPage(link.replace('{name}', name), fullCrumb, crumb);
    }
  }

  async function deleteJobs() {
    const mainPage = await getPage('');
    await deleteByLink(
      'job/{name}/doDelete',
      getSubstringsFromPage(mainPage, 'href="job/', '/"'),
      getCrumbFromPage(mainPage)
    );
  }

  async function deleteViews() {
    const mainPage = await getPage('');
    await deleteByLink(
      'view/{name}/doDelete',
      getSubstringsFromPage(mainPage, 'href="/view/', '/"'),
      getCrumbFromPage(mainPage)
    );

    const viewPage = await getPage('me/my-views/view/all/');
    await deleteByLink(
      `user/${USERNAME.toLowerCase()}/my-views/view/{name}/doDelete`,
      getSubstringsFromPage(viewPage, `href="/user/${USERNAME.toLowerCase()}/my-views/view/`, '/"'),
      getCrumbFromPage(viewPage)
    );
  }

  async function deleteNodes() {
    const mainPage = await getPage('');
    await deleteByLink(
      'computer/{name}/doDelete',
      getSubstringsFromPage(mainPage, 'href="/computer/', '/"'),
      getCrumbFromPage(mainPage)
    );
  }

  async function deleteUsers() {
    const userPage = await getPage('manage/securityRealm/');
    const crumb = getCrumbFromPage(userPage);

    const users = getSubstringsFromPage(userPage, 'href="user/', '/"');

    users.delete(USERNAME.toLowerCase());

    await deleteByLink('manage/securityRealm/user/{name}/doDelete', users, crumb);
  }

  async function deleteDescription() {
    const mainPage = await getPage('');
    const crumb = getCrumbFromPage(mainPage);

    const body = `description=&Submit=&Jenkins-Crumb=${crumb}&json=%7B%22description%22%3A+%22%22%7D`;
    await postPage('submitDescription', body, crumb);
  }

  console.log('🧹 Cleaning Jenkins data...');
  await deleteViews();
  await deleteJobs();
  await deleteUsers();
  await deleteNodes();
  await deleteDescription();
  console.log('✅ Jenkins data cleaned successfully');
}
