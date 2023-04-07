import React, { ChangeEvent, MouseEvent, FC } from 'react';
import { Input, Button, TextArea, InlineFormLabel } from '@grafana/ui';

interface Props {
    hasCert: boolean;
    label: string;
    tooltip: string;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    value: string;
}

export const CertificationKey: FC<Props> = ({ hasCert, label, tooltip, onChange, onClick, placeholder, value}) => {
    return (
        <div className="gf-form">
            <InlineFormLabel width={6} tooltip={tooltip}>{label}</InlineFormLabel>
            {hasCert ? (
                <>
                    <Input type="text" disabled value="configured" width={40}/>
                    <Button variant="secondary" onClick={onClick} style={{ marginLeft: 4 }}>
                        Reset
                    </Button>
                </>
            ) : (
                <TextArea rows={8} onChange={onChange} placeholder={placeholder} value={value} required />
            )}
        </div>
    );
};
