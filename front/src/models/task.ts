import * as yup from "yup";

const Task = yup.object({
	name: yup.string().required(),
	description: yup.string().required(),
});

const ActiveTask = Task.concat(
	yup.object({
		data: yup.mixed(),
	}),
);

type Task = yup.InferType<typeof Task>;
type ActiveTask = yup.InferType<typeof ActiveTask>;

export { Task, ActiveTask };
