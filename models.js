// OOP classes for the three tables in the school database.

function requiredText(value, field) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`Please enter ${field}.`);
  return text;
}

function wholeNumber(value, field, minimum) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`Please enter ${field}.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    throw new Error(`${field} must be a whole number of at least ${minimum}.`);
  }
  return number;
}

class Student {
  constructor(data = {}) {
    this.student_id = data.student_id ?? data.id ?? null;
    this.first_name = requiredText(data.first_name, 'first name');
    this.last_name = requiredText(data.last_name, 'last name');
    this.email = requiredText(data.email, 'email');
    this.created_at = data.created_at ?? null;
  }

  toRecord() {
    return {
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email
    };
  }

  toJSON() {
    return { id: this.student_id, ...this.toRecord(), created_at: this.created_at };
  }
}

class Course {
  constructor(data = {}) {
    this.course_id = data.course_id ?? data.id ?? null;
    this.course_code = requiredText(data.course_code, 'course code');
    this.course_name = requiredText(data.course_name, 'course name');
    this.credits = wholeNumber(data.credits, 'Credits', 0);
  }

  toRecord() {
    return {
      course_code: this.course_code,
      course_name: this.course_name,
      credits: this.credits
    };
  }

  toJSON() {
    return { id: this.course_id, ...this.toRecord() };
  }
}

class Enrollment {
  constructor(data = {}) {
    this.id = data.id ?? null; // SQLite rowid for edit/delete
    this.student_id = wholeNumber(data.student_id, 'Student ID', 1);
    this.course_id = wholeNumber(data.course_id, 'Course ID', 1);
    this.registration_date = requiredText(data.registration_date, 'registration date');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.registration_date) ||
        Number.isNaN(Date.parse(this.registration_date))) {
      throw new Error('Please enter a valid registration date.');
    }

    // These labels come from joining Students and Courses when showing records.
    this.student_name = data.student_name ?? '';
    this.course_label = data.course_label ?? '';
  }

  toRecord() {
    return {
      student_id: this.student_id,
      course_id: this.course_id,
      registration_date: this.registration_date
    };
  }

  toJSON() {
    return {
      id: this.id,
      ...this.toRecord(),
      student_name: this.student_name,
      course_label: this.course_label
    };
  }
}

module.exports = { Student, Course, Enrollment };
