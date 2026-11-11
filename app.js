// Names match the input fields in index.html.
const fields = {
  students: ['first_name', 'last_name', 'email'],
  courses: ['course_code', 'course_name', 'credits'],
  enrollments: ['student_id', 'course_id', 'registration_date']
};

async function request(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong');
  return result;
}

async function loadTable(type) {
  try {
    const rows = await request(`/api/${type}`);
 const tbody = document.getElementById(type + 'Rows');
    tbody.innerHTML = '';

    for (const row of rows) {
      const tr = document.createElement('tr');
      if (type === 'enrollments') {
        // Display student and course names, plus their IDs.
        addCell(tr, `${row.student_name} (ID: ${row.student_id})`);
        addCell(tr, `${row.course_label} (ID: ${row.course_id})`);
        addCell(tr, row.registration_date);
      } else {
        addCell(tr, row.id);
        for (const field of fields[type]) addCell(tr, row[field]);
      }

      const actions = document.createElement('td');
      const edit = document.createElement('button');
      edit.textContent = 'Edit';
      edit.onclick = () => editRecord(type, row);

      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.onclick = () => deleteRecord(type, row.id);
      actions.append(edit, del);
      tr.appendChild(actions);
      tbody.appendChild(tr);
    }
  } catch (error) { alert(error.message); }
}

function addCell(tr, value) {
  const td = document.createElement('td');
  td.textContent = value ?? '';
  tr.appendChild(td);
}

function editRecord(type, row) {
  const form = document.getElementById(type + 'Form');
  form.dataset.id = row.id;
  for (const field of fields[type]) form.elements[field].value = row[field];
  form.querySelector('[type="submit"]').textContent = 'Update';
}

function clearForm(type) {
  const form = document.getElementById(type + 'Form');
  form.reset();
  delete form.dataset.id;
  form.querySelector('[type="submit"]').textContent = 'Insert';
}

async function saveRecord(event, type) {
  event.preventDefault();
  const form = event.target;
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form));
  const method = id ? 'PUT' : 'POST';
  const url = `/api/${type}${id ? '/' + id : ''}`;

  try {
    await request(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    clearForm(type);
    await loadTable(type);
  } catch (error) { alert(error.message); }
}

async function deleteRecord(type, id) {
  if (!confirm('Delete this record?')) return;
  try {
    await request(`/api/${type}/${id}`, { method: 'DELETE' });
    clearForm(type);
    await loadTable(type);
  } catch (error) { alert(error.message); }
}

for (const type of Object.keys(fields)) {
  document.getElementById(type + 'Form').addEventListener('submit', event => saveRecord(event, type));
  loadTable(type);
}
