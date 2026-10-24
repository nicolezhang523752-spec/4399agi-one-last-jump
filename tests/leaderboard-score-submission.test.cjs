const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function scenario({ user, insertError }) {
  const title = { textContent: '' };
  const copy = { textContent: '' };
  const retry = { hidden: true, addEventListener() {} };
  const status = { textContent: '' };
  const box = {
    hidden: true,
    dataset: {},
    querySelector(selector) {
      return { '#score-feedback-title': title, '#score-feedback-copy': copy, '#retry-score': retry }[selector];
    }
  };
  const inserts = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      assert.equal(table, 'scores');
      return {
        async insert(row) { inserts.push(row); return { error: insertError || null }; }
      };
    }
  };
  const window = { AGI_AUTH_CLIENT: client };
  const document = { querySelector: selector => ({ '#score-feedback': box, '#game-status': status })[selector] };
  vm.runInNewContext(fs.readFileSync('js/score-submission.js', 'utf8'), { window, document, Number, String, Set });
  const result = {
    run_id: '11111111-1111-4111-8111-111111111111',
    score: 3650, level_reached: 2, completion_time: 4000
  };
  await window.AGI_SCORE_SUBMIT(result);
  return { title, copy, retry, inserts, box, window, result };
}

(async () => {
  const success = await scenario({ user: { id: 'player-1' } });
  assert.equal(success.title.textContent, 'SCORE SAVED');
  assert.equal(success.inserts.length, 1);
  assert.equal(success.inserts[0].user_id, 'player-1');
  await success.window.AGI_SCORE_SUBMIT(success.result);
  assert.equal(success.inserts.length, 1, 'same run must not insert twice');

  const failure = await scenario({ user: { id: 'player-1' }, insertError: { code: '42501' } });
  assert.equal(failure.title.textContent, 'FAILED TO SAVE SCORE');
  assert.equal(failure.retry.hidden, false);

  const guest = await scenario({ user: null });
  assert.equal(guest.title.textContent, 'SIGN IN TO SAVE');
  assert.equal(guest.inserts.length, 0);
  console.log('score submission states: passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
