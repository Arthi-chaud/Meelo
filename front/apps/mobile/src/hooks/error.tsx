import type {
	UseInfiniteQueryResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "~/api";
import { closeModalAtom, useModal } from "~/components/bottom-modal-sheet";
import { ErrorModal } from "~/components/error-modal";

export const useQueryErrorModal = (
	queries: (UseQueryResult<any> | UseInfiniteQueryResult<any>)[],
) => {
	const closeModal = useSetAtom(closeModalAtom);
	const queryClient = useQueryClient();
	const retryQueries = useCallback(() => {
		for (const q of queries) {
			q.refetch();
		}
	}, [queries, queryClient]);
	const memoisedErrs = useMemo(
		() => queries.map((q) => q.error).filter((e): e is Error => e !== null),
		[queries],
	);
	const firstError = useMemo(
		() => memoisedErrs.at(0) ?? null,
		[memoisedErrs],
	);

	const content = useCallback(() => {
		if (firstError) {
			return (
				<ErrorModal
					error={firstError}
					dismiss={closeModal}
					tryAgain={() => {
						closeModal;
						retryQueries();
					}}
				/>
			);
		}
		return null;
	}, [firstError, queryClient]);

	const { openModal } = useModal({ content, cannotBeDismissed: true });

	useEffect(() => {
		if (firstError) {
			openModal();
		}
		return () => {
			closeModal();
		};
	}, [openModal, firstError, closeModal]);
};
