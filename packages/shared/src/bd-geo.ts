/** All 64 districts of Bangladesh (A–Z). */
export const BD_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
] as const;

export type BdDistrict = (typeof BD_DISTRICTS)[number];

const CHATTOGRAM = new Set([
  "Bandarban",
  "Brahmanbaria",
  "Chandpur",
  "Chattogram",
  "Cox's Bazar",
  "Cumilla",
  "Feni",
  "Khagrachhari",
  "Lakshmipur",
  "Noakhali",
  "Rangamati",
]);

const SYLHET = new Set(["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]);

const RAJSHAHI = new Set([
  "Bogura",
  "Chapainawabganj",
  "Joypurhat",
  "Naogaon",
  "Natore",
  "Pabna",
  "Rajshahi",
  "Sirajganj",
]);

const RANGPUR = new Set([
  "Dinajpur",
  "Gaibandha",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Rangpur",
  "Thakurgaon",
]);

const KHULNA = new Set([
  "Bagerhat",
  "Chuadanga",
  "Jashore",
  "Jhenaidah",
  "Khulna",
  "Kushtia",
  "Magura",
  "Meherpur",
  "Narail",
  "Satkhira",
]);

const BARISHAL = new Set([
  "Barguna",
  "Barishal",
  "Bhola",
  "Jhalokathi",
  "Patuakhali",
  "Pirojpur",
]);

const MYMENSINGH = new Set(["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"]);

export function divisionForDistrict(district: string): string {
  if (CHATTOGRAM.has(district)) return "Chattogram";
  if (SYLHET.has(district)) return "Sylhet";
  if (RAJSHAHI.has(district)) return "Rajshahi";
  if (RANGPUR.has(district)) return "Rangpur";
  if (KHULNA.has(district)) return "Khulna";
  if (BARISHAL.has(district)) return "Barishal";
  if (MYMENSINGH.has(district)) return "Mymensingh";
  return "Dhaka";
}
