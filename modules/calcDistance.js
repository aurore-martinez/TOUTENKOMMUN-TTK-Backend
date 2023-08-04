/**
 * Convertit des degrés en radian
 * @param {Number} degrees 
 * @returns Un nombre en radian
 */
const degreesToRadians =  (degrees) => degrees * Math.PI / 180;

/**
 * Calcule le distance "à vol d'oiseau" entre deux positions données en latitude et longitude
 * @param {Number} lat1 
 * @param {Number} lon1 
 * @param {Number} lat2 
 * @param {Number} lon2 
 * @returns La distance séparant le point 1 du point 2
 */
const greatCircleDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371.0;
  const lat1_rad = degreesToRadians(lat1);
  const lon1_rad = degreesToRadians(lon1);
  const lat2_rad = degreesToRadians(lat2);
  const lon2_rad = degreesToRadians(lon2);

  const distance = R * Math.acos(Math.sin(lat1_rad) * Math.sin(lat2_rad) + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.cos(lon2_rad - lon1_rad));
  return Number(distance.toFixed(2));
}

module.exports = { greatCircleDistance };