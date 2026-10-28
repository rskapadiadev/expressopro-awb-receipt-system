import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
    COMPANY_LABELS,
    COMPANY_TOKENS,
    type CompanyProfile,
    companySchema,
} from '@shared/company';
import { placeholder } from '@shared/placeholders';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { ErrorBanner, FormField, Input, Textarea } from '@/components/ui/form';
import { applyServerErrors } from '@/lib/api';
import { companyQuery, useSave } from '@/lib/queries';

export function CompanyPage() {
    const { data } = useQuery(companyQuery);
    return (
        <>
            <PageHeader
                title="Company profile"
                description="Printed by the Company details element and by placeholders such as {tracking_link} in template text. Each receipt keeps the details it was booked with."
            />
            {/* Keyed so the form starts from the loaded profile. */}
            {data && <CompanyForm key={JSON.stringify(data)} profile={data} />}
        </>
    );
}

// Hint under each input: the placeholder that prints it inside static text.
const hint = (prop: keyof CompanyProfile) =>
    `In template text: ${placeholder(COMPANY_TOKENS[prop])}`;

function CompanyForm({ profile }: { profile: CompanyProfile }) {
    const save = useSave<CompanyProfile>('company', ['company']);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<CompanyProfile>({
        resolver: zodResolver(companySchema),
        defaultValues: profile,
    });

    const onSubmit = handleSubmit(async (input) => {
        try {
            await save.mutateAsync({ input });
        } catch (err) {
            applyServerErrors(err, setError);
        }
    });

    return (
        <Card className="animate-fade-up max-w-3xl p-5 sm:p-6">
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                <ErrorBanner message={errors.root?.message} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        label={COMPANY_LABELS.name}
                        htmlFor="name"
                        error={errors.name?.message}
                        hint={hint('name')}
                    >
                        <Input id="name" {...register('name')} />
                    </FormField>
                    <FormField
                        label={COMPANY_LABELS.trackingLink}
                        htmlFor="trackingLink"
                        error={errors.trackingLink?.message}
                        hint={hint('trackingLink')}
                    >
                        <Input
                            id="trackingLink"
                            placeholder="e.g. expressopro.in"
                            {...register('trackingLink')}
                        />
                    </FormField>
                    <FormField
                        label={COMPANY_LABELS.phone}
                        htmlFor="phone"
                        error={errors.phone?.message}
                        hint={hint('phone')}
                    >
                        <Input id="phone" type="tel" {...register('phone')} />
                    </FormField>
                    <FormField
                        label={COMPANY_LABELS.email}
                        htmlFor="email"
                        error={errors.email?.message}
                        hint={hint('email')}
                    >
                        <Input id="email" type="email" {...register('email')} />
                    </FormField>
                    <FormField
                        label={COMPANY_LABELS.gstin}
                        htmlFor="gstin"
                        error={errors.gstin?.message}
                        hint={hint('gstin')}
                    >
                        <Input id="gstin" className="uppercase" {...register('gstin')} />
                    </FormField>
                </div>
                <FormField
                    label={COMPANY_LABELS.address}
                    htmlFor="address"
                    error={errors.address?.message}
                    hint={hint('address')}
                >
                    <Textarea id="address" rows={3} {...register('address')} />
                </FormField>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !isDirty}>
                        <Save className="size-4" /> {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
