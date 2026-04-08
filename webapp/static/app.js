const $ = (sel) => document.querySelector(sel);

function parseCsv(value) {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function runSongwriter() {
  const payload = {
    query: $('#query').value.trim(),
    genres: parseCsv($('#genres').value),
    topics: parseCsv($('#topics').value),
    top_k: Number($('#topk').value || 5),
  };

  if (!payload.query) {
    alert('Please enter a song goal/query.');
    return;
  }

  const btn = $('#go');
  btn.disabled = true;
  btn.textContent = 'Thinking...';

  try {
    const res = await fetch('/api/songwrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');

    $('#output').classList.remove('hidden');
    $('#concept').textContent = data.concept;
    $('#titles').innerHTML = data.titles.map((t) => `<li>${t}</li>`).join('');
    $('#verse').textContent = data.verse;
    $('#chorus').textContent = data.chorus;
    $('#rewrite').textContent = data.rewrite_note;

    $('#matches').innerHTML = data.matches
      .map(
        (m, i) => `
        <article class="match">
          <h4>[${i + 1}] ${m.source}</h4>
          <p><strong>Heading:</strong> ${m.heading || 'n/a'} | <strong>score:</strong> ${m.score}</p>
          <p><strong>Genres:</strong> ${m.genres.join(', ')} | <strong>Topics:</strong> ${m.topics.join(', ')}</p>
          <p>${m.preview}...</p>
        </article>`
      )
      .join('');
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Song Draft';
  }
}

$('#go').addEventListener('click', runSongwriter);
