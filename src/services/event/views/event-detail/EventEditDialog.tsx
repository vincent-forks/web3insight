'use client';

import { useState, useEffect, useRef, MouseEvent } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Textarea, Button, Chip,
} from "@nextui-org/react";
import { Calendar, AlertTriangle, X } from "lucide-react";
import { useAtom } from "jotai";

import { addToastAtom } from "#/atoms";
import FileUpload from "$/controls/file-upload";
import { updateOne } from "../../repository/client";
import { resolveContestants } from "../event-list/helper";
import ContestantListDialog from "../event-list/ContestantListDialog";

import type { EventReport, Contestant } from "../../typing";

type EventEditDialogProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  event: EventReport | null;
  onAnalysisStart?: (eventId: number, contestants: Contestant[], failedAccounts: string[]) => void;
};

function EventEditDialog({ visible, onClose, event, onAnalysisStart }: EventEditDialogProps) {
  const [, addToast] = useAtom(addToastAtom);
  const [description, setDescription] = useState("");
  const [currentParticipants, setCurrentParticipants] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);

  // Initialize form with event data
  useEffect(() => {
    if (event && visible) {
      setDescription(event.description || "");

      // Load original request_data if available, otherwise try to derive from contestants
      let participantList: string[] = [];

      if (event.request_data && event.request_data.length > 0) {
        participantList = event.request_data;
      } else if (event.contestants && event.contestants.length > 0) {
        // Fallback: extract GitHub usernames from contestants
        participantList = event.contestants.map(contestant => contestant.username);
      }

      setCurrentParticipants(participantList);
      setUserInput("");
    }
  }, [event, visible]);

  const handleCsvUpload = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    uploadRef.current?.click();
  };

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserInput(e.target?.result as string);

      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const closeDialog = () => {
    setDescription("");
    setCurrentParticipants([]);
    setUserInput("");
    setLoading(false);
    onClose();
  };

  const removeParticipant = (index: number) => {
    setCurrentParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!event) return;

    const resolvedDescription = description && description.trim();

    if (!resolvedDescription) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Event name is required',
      });
      return;
    }

    // Combine current participants with new additions
    const newParticipants = resolveContestants(userInput);
    const allParticipants = [...currentParticipants, ...newParticipants];

    if (allParticipants.length === 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'At least one participant is required',
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Update the event
      const result = await updateOne({
        id: Number(event.id),
        urls: allParticipants,
        description: resolvedDescription,
      });

      if (result.success) {
        setLoading(false);
        
        addToast({
          type: 'success',
          title: 'Event Updated',
          message: 'Event updated successfully. Analysis in progress...',
        });

        // Trigger the analysis dialog
        if (onAnalysisStart) {
          onAnalysisStart(Number(event.id), result.data || [], result.extra?.fail || []);
        }
      } else {
        setLoading(false);
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      setLoading(false);

      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update event',
      });
    }
  };


  return (
    <Modal
      backdrop="blur"
      isOpen={visible}
      onClose={closeDialog}
      placement="center"
      size="lg"
      isDismissable={true}
      isKeyboardDismissDisabled={false}
      classNames={{
        base: "max-w-2xl mx-4 max-h-[80vh] my-8",
        wrapper: "overflow-visible",
        backdrop: "bg-background-dark/50",
        header: "border-b border-border dark:border-border-dark",
        body: "p-0 overflow-hidden",
        closeButton: "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
      }}
    >
      <ModalContent className="bg-white dark:bg-surface-dark shadow-subtle border border-border dark:border-border-dark flex flex-col max-h-full">
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3 px-6 py-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Event
                  {event && (
                    <Chip size="sm" variant="flat" color="primary" className="ml-2">
                      #{event.id}
                    </Chip>
                  )}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Update event details and manage participants
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-6 relative">

                <div className="space-y-6">
                  <Textarea
                    value={description}
                    placeholder="Enter event name (e.g., OpenBuild Hackathon)"
                    label="Event Name"
                    labelPlacement="outside"
                    isRequired
                    onValueChange={setDescription}
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
                      input: "bg-white dark:bg-surface-dark border-border dark:border-border-dark",
                    }}
                  />

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Current Participants ({currentParticipants.length})
                    </label>
                    {currentParticipants.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-border dark:border-border-dark">
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-4">
                          {currentParticipants.map((participant, index) => (
                            <div
                              key={index}
                              className="relative bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-md px-3 py-2 group hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-center"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                {participant}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeParticipant(index)}
                                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 w-5 h-5 bg-white dark:bg-surface-dark hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full border border-border dark:border-border-dark flex items-center justify-center"
                                title="Remove participant"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-border dark:border-border-dark">
                        No current participants
                      </div>
                    )}
                  </div>

                  <Textarea
                    value={userInput}
                    placeholder="Enter GitHub username of new contestants, separated by comma"
                    label="Add New Participants"
                    labelPlacement="outside"
                    minRows={5}
                    maxRows={10}
                    onValueChange={setUserInput}
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
                      input: "bg-white dark:bg-surface-dark border-border dark:border-border-dark",
                    }}
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Input manually above or
                    </span>
                    <FileUpload
                      ref={uploadRef}
                      type="csv"
                      onChange={handleFileChange}
                    >
                      <Button
                        onClick={handleCsvUpload}
                        size="sm"
                        variant="bordered"
                        className="border-border dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/10"
                      >
                        import from CSV file
                      </Button>
                    </FileUpload>
                  </div>

                  {/* Warning Notice */}
                  <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-warning-600 dark:text-warning-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-warning-700 dark:text-warning-300">
                        <p className="font-medium mb-1">Analysis Re-run Notice</p>
                        <p>
                          Updating this event will trigger a complete re-analysis of all participants.
                          This process may take several minutes to complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="border-t border-border dark:border-border-dark px-6 py-4">
              <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
                <Button
                  variant="bordered"
                  onClick={() => closeDialog()}
                  className="flex-1 sm:flex-none border-border dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/10"
                >
                  {loading ? "Close" : "Cancel"}
                </Button>
                <Button
                  color="primary"
                  isLoading={loading}
                  onClick={handleConfirm}
                  isDisabled={loading || !description.trim()}
                  className="flex-1 sm:flex-none"
                >
                  Update Event
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Wrapper component to handle both edit dialog and analysis dialog
function EventEditDialogWrapper(props: EventEditDialogProps) {
  const [editVisible, setEditVisible] = useState(true);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [analysisEventId, setAnalysisEventId] = useState(0);
  const [analysisContestants, setAnalysisContestants] = useState<Contestant[]>([]);
  const [analysisFailedAccounts, setAnalysisFailedAccounts] = useState<string[]>([]);

  // Reset editVisible when props.visible changes from false to true
  useEffect(() => {
    if (props.visible && !editVisible) {
      setEditVisible(true);
    }
  }, [props.visible, editVisible]);

  const handleEditClose = () => {
    setEditVisible(false);
    props.onClose();
  };

  const handleAnalysisStart = (eventId: number, contestants: Contestant[], failedAccounts: string[]) => {
    setEditVisible(false);
    setAnalysisEventId(eventId);
    setAnalysisContestants(contestants);
    setAnalysisFailedAccounts(failedAccounts);
    setAnalysisVisible(true);
  };

  const handleAnalysisGoto = () => {
    setAnalysisVisible(false);
    props.onClose();
    // Trigger success callback to refresh the page
    if (props.onSuccess) {
      props.onSuccess();
    }
  };

  const handleAnalysisClose = () => {
    setAnalysisVisible(false);
    props.onClose();
  };

  return (
    <>
      <EventEditDialog
        {...props}
        visible={editVisible && props.visible}
        onClose={handleEditClose}
        onAnalysisStart={handleAnalysisStart}
      />
      <ContestantListDialog
        dataSource={analysisContestants}
        eventId={analysisEventId}
        failedAccounts={analysisFailedAccounts}
        visible={analysisVisible}
        onGoto={handleAnalysisGoto}
        onClose={handleAnalysisClose}
      />
    </>
  );
}

export default EventEditDialogWrapper;
