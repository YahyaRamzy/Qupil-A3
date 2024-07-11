document.addEventListener('DOMContentLoaded', () => {
  const micButtons = document.querySelectorAll('.micButton');

  micButtons.forEach(button => {
    button.addEventListener('click', () => {
      const question = button.dataset.question;
      startVoiceRecognition(question, button);
    });
  });

  const startVoiceRecognition = (question, button) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        let chunks = [];

        mediaRecorder.start();
        console.log(`Recording started for ${question}`);

        mediaRecorder.ondataavailable = event => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          console.log(`Recording stopped for ${question}`);
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');

          fetch('/transcribe', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            console.log(`Transcription for question ${question}:`, data.transcription);
            const cleanedText = data.transcription.replace(/[\s.]/g, '').toLowerCase();
            selectAnswer(question, cleanedText, button);
          })
          .catch(error => {
            console.error('Error during transcription:', error);
          });
        };

        setTimeout(() => mediaRecorder.stop(), 3000);
      })
      .catch(error => console.error('Error accessing media devices.', error));
  };

  const selectAnswer = (question, text, button) => {
    const correctAnswers = {
      q1: 'الرحيم',
      q2: 'الصمد'
    };

    const choices = {
      q1: { a: 'الرحيم', b: 'الكريم', c: 'التواب'},
      q2: { a: 'الصمد', b: 'الرحمن', c: 'الكريم'}
    };

    let answeredCorrectly = false;
    console.log(text);
    for (const [key, value] of Object.entries(choices[question])) {
      if (text.includes(value)) {
        document.getElementById(`${question}${key}`).checked = true;
        if (value === correctAnswers[question]) {
          answeredCorrectly = true;
        }
        break;
      }
    }
    const resultCorrect = button.parentNode.querySelector('.resultCorrect');
    const resultInCorrect = button.parentNode.querySelector('.resultInCorrect');
    const audioElement = button.parentNode.querySelector('.correctAnswerAudio');
    const playCorrectAnswerBtn = button.parentNode.querySelector('.playCorrectAnswer');
    if (answeredCorrectly) {
      resultCorrect.textContent = `احسنت الاجابة الصحيحة :  ${correctAnswers[question]}`;
      button.disabled = true;
      resultInCorrect.style.display = 'none';
      playCorrectAnswerBtn.style.display = 'none';
      button.style.display = 'none';
    }else{
      playCorrectAnswerBtn.style.display = 'block';
      audioElement.src = `/answers/${question}.mp3`;
      playCorrectAnswerBtn.onclick = () => {
          audioElement.play();
      };
      resultInCorrect.textContent = `اجابة خاطئة`;
    }
  };

});
