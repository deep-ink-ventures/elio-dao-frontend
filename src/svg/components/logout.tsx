import { withSvgProps } from '@/components/SvgWrapper';

const Logout = withSvgProps(
  ({ width = 16, height = 16, stroke = '#E11D48', className }) => {
    return (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox='0 0 20 20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'>
        <path
          d='M14.9998 6.66667L18.3332 10M18.3332 10L14.9998 13.3333M18.3332 10H7.49984M12.4998 3.50337C11.4375 2.86523 10.2042 2.5 8.88873 2.5C4.9 2.5 1.6665 5.85786 1.6665 10C1.6665 14.1421 4.9 17.5 8.88873 17.5C10.2042 17.5 11.4375 17.1348 12.4998 16.4966'
          stroke={stroke}
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }
);

export default Logout;
