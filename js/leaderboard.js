(() => {
  const client = window.AGI_AUTH_CLIENT;
  const boardStatus = document.querySelector('#leaderboard-status');
  if (!boardStatus) return;
  const results = document.querySelector('#leaderboard-results');
  const podium = document.querySelector('#leaderboard-podium');
  const rest = document.querySelector('#leaderboard-rest');
  const you = document.querySelector('#leaderboard-you');
  const history = document.querySelector('#leaderboard-history');
  const number = new Intl.NumberFormat();
  const date = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  let topRows = [];
  let topLoaded = false;
  let currentId = null;
  let ownRequest = 0;

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = String(value);
    return element;
  }
  function timeLabel(milliseconds) {
    if (milliseconds == null) return '—';
    const total = Math.floor(milliseconds / 1000);
    const minutes = String(Math.floor(total / 60));
    const seconds = String(total % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  function meta(row) {
    return `LEVEL ${row.level_reached}  /  ${timeLabel(row.completion_time)}`;
  }
  function empty(target, title, copy, link = false) {
    target.replaceChildren();
    const box = node('div', 'leader-empty');
    box.append(node('strong', '', title), node('p', '', copy));
    if (link) {
      const anchor = node('a', '', 'PLAY NOW ↗');
      anchor.href = 'play.html';
      box.append(anchor);
    }
    target.append(box);
  }
  function showError(target, message) {
    target.replaceChildren(node('p', 'leader-status is-error', message));
  }
  function renderTop() {
    if (!topLoaded) return;
    podium.replaceChildren();
    rest.replaceChildren();
    if (!topRows.length) {
      results.hidden = true;
      boardStatus.hidden = false;
      boardStatus.textContent = 'No runs recorded yet. Be the first to set the pace.';
      return;
    }
    boardStatus.hidden = true;
    results.hidden = false;
    for (const row of topRows) {
      const rank = Number(row.rank);
      const li = node('li', row.user_id === currentId ? 'is-you' : '');
      const name = row.username || 'PLAYER';
      if (rank <= 3) {
        li.dataset.rank = String(rank).padStart(2, '0');
        const person = node('div', 'podium-person');
        person.append(node('strong', '', name), node('span', 'podium-score', number.format(row.score)), node('span', 'podium-meta', meta(row)));
        li.append(node('span', 'podium-rank', `#${String(rank).padStart(2, '0')}`), person);
        podium.append(li);
      } else {
        li.append(node('span', 'rank-number', `#${String(rank).padStart(2, '0')}`),
          node('span', 'rank-name', name),
          node('strong', 'rank-score', number.format(row.score)),
          node('span', 'rank-meta', meta(row)));
        rest.append(li);
      }
    }
  }
  async function loadTop() {
    if (!client) {
      boardStatus.textContent = 'Leaderboard service is unavailable. Please try again later.';
      boardStatus.classList.add('is-error');
      return;
    }
    const { data, error } = await client.from('leaderboard_view')
      .select('rank,user_id,username,score,level_reached,completion_time,created_at')
      .order('rank', { ascending: true }).limit(10);
    if (error) {
      boardStatus.textContent = 'Leaderboard could not be loaded. Please try again later.';
      boardStatus.classList.add('is-error');
      return;
    }
    topRows = data || [];
    topLoaded = true;
    renderTop();
  }
  function showGuest() {
    currentId = null;
    renderTop();
    you.replaceChildren();
    const box = node('div', 'leader-empty');
    box.append(node('strong', '', 'MAKE YOUR MARK.'), node('p', '', 'Sign in, play a run, and see your place on the board.'));
    const button = node('button', 'leader-signin', 'SIGN IN ↗');
    button.type = 'button';
    button.addEventListener('click', () => document.querySelector('.desktop-nav .account-link')?.click());
    box.append(button);
    you.append(box);
    history.replaceChildren(node('p', 'leader-status', 'Sign in to see your recent runs.'));
  }
  async function loadOwn(user, version) {
    currentId = user.id;
    renderTop();
    you.replaceChildren(node('p', 'leader-status', 'Loading your record…'));
    history.replaceChildren(node('p', 'leader-status', 'Loading recent runs…'));
    const [best, recent, rank] = await Promise.all([
      client.from('scores').select('score,level_reached,completion_time,created_at')
        .eq('user_id', user.id).order('score', { ascending: false })
        .order('level_reached', { ascending: false })
        .order('completion_time', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true }).limit(1),
      client.from('scores').select('score,level_reached,completion_time,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      client.from('leaderboard_view').select('rank').eq('user_id', user.id).maybeSingle()
    ]);
    if (version !== ownRequest) return;
    if (best.error || recent.error || rank.error) {
      showError(you, 'Your scores could not be loaded. Please try again later.');
      showError(history, 'Recent runs could not be loaded.');
      return;
    }
    const bestRow = best.data?.[0];
    const recentRows = recent.data || [];
    if (!bestRow) {
      empty(you, 'NO RUNS RECORDED YET.', 'Play now to set your first score.', true);
      history.replaceChildren(node('p', 'leader-status', 'Your completed runs will appear here.'));
      return;
    }
    const grid = node('div', 'leader-you-grid');
    for (const [label, value, detail] of [
      ['YOUR RANK', rank.data ? `#${rank.data.rank}` : '—', 'Among all players'],
      ['BEST SCORE', number.format(bestRow.score), `Level ${bestRow.level_reached}`],
      ['LAST RUN', number.format(recentRows[0]?.score ?? bestRow.score), recentRows[0] ? date.format(new Date(recentRows[0].created_at)) : '—']
    ]) {
      const panel = node('div');
      panel.append(node('span', '', label), node('strong', '', value), node('small', '', detail));
      grid.append(panel);
    }
    you.replaceChildren(grid);
    history.replaceChildren();
    for (const row of recentRows) {
      const item = node('div', 'history-row');
      const when = node('time', '', date.format(new Date(row.created_at)));
      when.dateTime = row.created_at;
      item.append(when, node('strong', '', number.format(row.score)),
        node('span', '', `LEVEL ${row.level_reached}`), node('span', '', timeLabel(row.completion_time)));
      history.append(item);
    }
  }

  if (!client) {
    loadTop();
    showError(you, 'Account service is unavailable.');
    showError(history, 'Recent runs are unavailable.');
    return;
  }
  loadTop();
  client.auth.onAuthStateChange((_event, session) => {
    const version = ++ownRequest;
    if (session?.user) setTimeout(() => loadOwn(session.user, version), 0);
    else showGuest();
  });
})();
