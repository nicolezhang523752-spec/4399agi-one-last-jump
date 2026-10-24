(() => {
  const client = window.AGI_AUTH_CLIENT;
  const box = document.querySelector('#score-feedback');
  if (!box) return;
  document.querySelector('#game-shell')?.append(box);
  const title = box.querySelector('#score-feedback-title');
  const copy = box.querySelector('#score-feedback-copy');
  const retry = box.querySelector('#retry-score');
  const status = document.querySelector('#game-status');
  const saved = new Set();
  let lastResult = null;
  let busy = false;

  function feedback(heading, detail, state, canRetry = false) {
    box.hidden = false;
    box.dataset.state = state;
    title.textContent = heading;
    copy.textContent = detail;
    retry.hidden = !canRetry;
    status.textContent = heading;
  }
  function validResult(result) {
    return result && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.run_id)
      && Number.isSafeInteger(result.score) && result.score >= 0 && result.score <= 1000000000
      && Number.isInteger(result.level_reached) && result.level_reached >= 1 && result.level_reached <= 3
      && Number.isInteger(result.completion_time) && result.completion_time >= 0 && result.completion_time <= 86400000;
  }
  async function submit(result) {
    if (!validResult(result) || busy || saved.has(result.run_id)) return;
    lastResult = result;
    if (!client) {
      feedback('FAILED TO SAVE SCORE', 'The account service is unavailable. Try again later.', 'error', true);
      return;
    }
    busy = true;
    retry.hidden = true;
    feedback('SAVING SCORE', `Run score: ${result.score.toLocaleString()}`, 'pending');
    try {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData?.user) {
        feedback('SIGN IN TO SAVE', 'This run is not saved yet. Sign in, then retry saving.', 'error', true);
        return;
      }
      const { error } = await client.from('scores').insert({
        run_id: result.run_id,
        user_id: authData.user.id,
        score: result.score,
        level_reached: result.level_reached,
        completion_time: result.completion_time,
        attempts: null
      });
      if (error) {
        // A repeated result event may encounter the idempotency constraint.
        // Confirm the row exists before reporting it as saved.
        if (error.code === '23505') {
          const { data: existing, error: readError } = await client.from('scores')
            .select('id').eq('user_id', authData.user.id).eq('run_id', result.run_id).maybeSingle();
          if (!readError && existing) {
            saved.add(result.run_id);
            feedback('SCORE SAVED', 'This run was already recorded. View your rank on the leaderboard.', 'success');
            return;
          }
        }
        throw error;
      }
      saved.add(result.run_id);
      feedback('SCORE SAVED', 'Your run is on the board. View your rank on the leaderboard.', 'success');
    } catch {
      feedback('FAILED TO SAVE SCORE', 'Your run is not confirmed in the database. Please retry.', 'error', true);
    } finally {
      busy = false;
    }
  }
  retry.addEventListener('click', () => { if (lastResult) submit(lastResult); });
  window.AGI_SCORE_SUBMIT = submit;
})();
