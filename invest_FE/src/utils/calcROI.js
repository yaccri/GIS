/* src/utils/calcROI.js */

/**
 * Calculates ROI as a percentage based on price, rent, and expenses.
 * Returns formatted percentage (e.g., "5.2%") if price and rent are > 0, else "".
 * @param {Object} params - Input parameters
 * @param {number|string} params.price - Property price
 * @param {number|string} params.rent - Monthly rent estimate
 * @param {number|string} [params.hoa] - Monthly HOA fee (optional)
 * @param {number|string} [params.propertyTax] - Annual property tax (optional)
 * @param {number|string} [params.insurance] - Monthly insurance cost (optional)
 * @returns {string} Formatted ROI percentage or empty string
 */
export const calcROI = ({ price, rent, hoa, propertyTax, insurance }) => {
  console.log("calcROI started");
  const parsedPrice = Number(price);
  const parsedRent = Number(rent);

  // Return "" if price or rent is not a number > 0
  if (!parsedPrice || !parsedRent || parsedPrice <= 0 || parsedRent <= 0) {
    console.log(
      `calcROI failed with parsedPrice ${parsedPrice} and parsedRent ${parsedRent}`
    );
    return "";
  }

  // Annualize rent (monthly rent * 12)
  const annualIncome = parsedRent * 12;

  // Calculate annual expenses
  const annualHoa = Number(hoa) ? Number(hoa) * 12 : 0;
  const annualPropertyTax = Number(propertyTax) || 0;
  const annualInsurance = Number(insurance) ? Number(insurance) * 12 : 0;
  const totalExpenses = annualHoa + annualPropertyTax + annualInsurance;

  // Calculate ROI: ((income - expenses) / price) * 100
  const roi = ((annualIncome - totalExpenses) / parsedPrice) * 100;

  // Return formatted percentage or "" if invalid
  console.log(`calcROI returned ${roi.toFixed(1)}%`);
  return isFinite(roi) && roi >= 0 ? `${roi.toFixed(1)}%` : "";
};
