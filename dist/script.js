(() => {
  const clock = document.getElementById('shenzhen-time');
  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  function updateClock() {
    const now = new Date();
    clock.textContent = format.format(now);
    clock.dateTime = now.toISOString();
  }
  updateClock();
  setInterval(updateClock, 1000);
})();
