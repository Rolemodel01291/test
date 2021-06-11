export default (ref, validateWithStateUpdate): void => {
  if (!ref.removeEventListener) return;
  ref.removeEventListener('input', validateWithStateUpdate);
  ref.removeEventListener('change', validateWithStateUpdate);
  ref.removeEventListener('blur', validateWithStateUpdate);
};
