import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const DeleteModel = ({children, modelName, callBack}) => {
    const [visibility, setVisibility] = React.useState(false);
    const handleDelete = async (e) => {
        e.preventDefault();
        const res = await window?.ipc?.invoke('deleteModel', modelName);
        setVisibility(false);
        callBack && callBack();
    }
    return (
        <AlertDialog open={visibility}>
            <AlertDialogTrigger asChild onClick={() => setVisibility(true)}>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>确认删除该模型？</AlertDialogTitle>
                    <AlertDialogDescription>
                        删除之后，如果你需要再次使用该模型，需要重新下载。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setVisibility(false)}>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    );
};

export default DeleteModel;
