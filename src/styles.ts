import { css } from '@emotion/css';

export const styles = {
  Common: {
    grid5: css`
      display: grid;
      grid-template-columns: repeat(5, min-content);
      grid-gap: 4px;
      align-items: center;
      margin-bottom: 4px;
    `,
    logicalOpAbsolutePosition: css`
      position: absolute;
      left: 46px;
    `,
    fieldsSelectWrapper: css`
      display: flex;
      align-items: flex-start;
    `,
    inlineFieldWithAddition: css`
      display: flex;
      align-items: flex-start;
    `,
    queryBuilderSettings: css`
      display: flex;
      align-items: center;
      gap: 4px;
    `,
  },
};
