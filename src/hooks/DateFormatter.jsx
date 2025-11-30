const formatFullDate = (value) => {
  const date = new Date(value);

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const month = monthNames[date.getMonth()];
  const dayName = dayNames[date.getDay()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

export default formatFullDate;
