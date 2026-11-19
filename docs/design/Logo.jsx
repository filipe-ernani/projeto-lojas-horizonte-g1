import styles from "./Logo.module.css";

export default function Logo({ iconOnly = false, className = "", ...rest }) {
  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 8 110 108"
        fill="none"
        role="img"
        aria-label="Horizonte"
        className={`${styles.logo} ${className}`.trim()}
        {...rest}
      >
        <g id="logo-icon">
          <path
            className={styles.semicircleTop}
            d="M0.65 58A50 50 0 1 1 99.35 58Z"
          />
          <path
            className={styles.semicircleBottom}
            transform="translate(10)"
            d="M2.3 65A50 50 0 0 0 97.7 65Z"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 490 120"
      fill="none"
      role="img"
      aria-label="Horizonte"
      className={`${styles.logo} ${className}`.trim()}
      {...rest}
    >
      <g id="logo-icon">
        <path
          className={styles.semicircleTop}
          d="M0.65 58A50 50 0 1 1 99.35 58Z"
        />
        <path
          className={styles.semicircleBottom}
          transform="translate(10)"
          d="M2.3 65A50 50 0 0 0 97.7 65Z"
        />
      </g>
      <g id="logo-wordmark" transform="translate(146 29) scale(0.42)">
        <g transform="translate(0)">
          <rect className={styles.logoText} width="9" height="100" />
          <rect className={styles.logoText} x="61" width="9" height="100" />
          <rect className={styles.logoText} y="45.5" width="70" height="9" />
        </g>
        <g transform="translate(92)">
          <circle
            className={styles.logoStroke}
            cx="50"
            cy="50"
            r="45.5"
            strokeWidth="9"
          />
        </g>
        <g transform="translate(214)">
          <rect className={styles.logoText} width="9" height="100" />
          <path
            className={styles.logoStroke}
            d="M4.5 4.5H42a23 23 0 0 1 0 46H4.5"
            strokeWidth="9"
          />
          <path className={styles.logoText} d="M36 50.5H49L70 100H57Z" />
        </g>
        <g transform="translate(306)">
          <rect className={styles.logoText} width="9" height="100" />
        </g>
        <g transform="translate(337)">
          <path
            className={styles.logoText}
            d="M0 0H68V9.5L18 90.5H68V100H0V90.5H8L58 9.5H0Z"
          />
        </g>
        <g transform="translate(427)">
          <circle
            className={styles.logoStroke}
            cx="50"
            cy="50"
            r="45.5"
            strokeWidth="9"
          />
        </g>
        <g transform="translate(549)">
          <rect className={styles.logoText} width="9" height="100" />
          <rect className={styles.logoText} x="61" width="9" height="100" />
          <path className={styles.logoText} d="M0 0H10.5L70 100H59.5Z" />
        </g>
        <g transform="translate(641)">
          <rect className={styles.logoText} width="70" height="9" />
          <rect className={styles.logoText} x="30.5" width="9" height="100" />
        </g>
        <g transform="translate(733)">
          <rect className={styles.logoText} width="9" height="100" />
          <rect className={styles.logoText} width="62" height="9" />
          <rect className={styles.logoText} y="45.5" width="54" height="9" />
          <rect className={styles.logoText} y="91" width="62" height="9" />
        </g>
      </g>
    </svg>
  );
}
