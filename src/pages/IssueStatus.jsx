// src/pages/IssueStatus.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config/middleware_config";

import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Flex,
} from "@chakra-ui/react";
import { BiArrowBack } from "react-icons/bi";
import { FaUser, FaBug, FaInfoCircle, FaClipboardList } from "react-icons/fa";

// --- helpers ---
const sameId = (a, b) => String(a) === String(b);
const authHeaders = (userId) => (userId ? { "x-user-id": userId } : {});

const pickArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === "object") {
    const k = Object.keys(raw).find((x) => Array.isArray(raw[x]));
    if (k) return raw[k];
  }
  return [];
};

export default function IssueStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [issue, setIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  // Load issue
  useEffect(() => {
    let cancelled = false;

    async function loadIssue() {
      setError("");
      setIssue(null);
      try {
        const res = await axios.get(config.ISSUE_BY_ID(id), {
          headers: authHeaders(userId),
        });
        const data = res?.data;
        if (!cancelled) {
          const one = data?.issue ?? data;
          if (one && typeof one === "object") {
            setIssue(one);
            return;
          }
          throw new Error("Invalid response for issue by ID");
        }
      } catch (e1) {
        try {
          const resAll = await axios.get(config.ISSUES_ROUTE, {
            headers: authHeaders(userId),
          });
          const all = pickArray(resAll?.data);
          const found = all.find((i) => sameId(i?.id, id));
          if (!cancelled) {
            if (found) setIssue(found);
            else setError(`Issue #${id} not found`);
          }
        } catch (e2) {
          if (!cancelled) {
            setError(
              e2?.response?.data?.message ||
                e1?.response?.data?.message ||
                "Failed to load issue"
            );
          }
        }
      }
    }

    loadIssue();
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  // Load users
  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      try {
        const res = await axios.get(config.USERS_ROUTE, {
          headers: authHeaders(userId),
        });
        const list = pickArray(res?.data);
        if (!cancelled) setUsers(list);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    }
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <Box p={6} maxW="600px" mx="auto">
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
        <Button
          leftIcon={<BiArrowBack />}
          colorScheme="gray"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!issue) {
    return (
      <Flex minH="50vh" align="center" justify="center">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  // map IDs → usernames
  const reporterName =
    users.find((u) => sameId(u.id, issue.user_id))?.username || "Unknown User";

  const assigneeName = issue.assignee_id
    ? users.find((u) => sameId(u.id, issue.assignee_id))?.username ||
      "Unknown User"
    : "Unassigned";

  return (
    <Box p={6} maxW="700px" mx="auto">
      <Card shadow="md" borderWidth="1px" borderRadius="lg">
        <CardHeader bg="gray.50" borderBottomWidth="1px">
          <Heading size="md">
            <FaBug style={{ display: "inline", marginRight: "8px" }} />
            Issue #{issue.id}
          </Heading>
        </CardHeader>
        <CardBody>
          <Box mb={4}>
            <Text fontWeight="bold">
              <FaClipboardList style={{ display: "inline", marginRight: "6px" }} />
              Title:
            </Text>
            <Text>{issue.title}</Text>
          </Box>

          <Box mb={4}>
            <Text fontWeight="bold">
              <FaInfoCircle style={{ display: "inline", marginRight: "6px" }} />
              Description:
            </Text>
            <Text>{issue.description}</Text>
          </Box>

          <Box mb={4}>
            <Text fontWeight="bold">Status:</Text>
            <Badge colorScheme={issue.status === "Closed" ? "red" : "green"}>
              {issue.status}
            </Badge>
          </Box>

          <Box mb={4}>
            <Text fontWeight="bold">
              <FaUser style={{ display: "inline", marginRight: "6px" }} />
              Reported by:
            </Text>
            <Text>
              {reporterName} (ID: {issue.user_id})
            </Text>
          </Box>

          <Box mb={4}>
            <Text fontWeight="bold">Assigned to:</Text>
            <Text>
              {assigneeName}
              {issue.assignee_id && ` (ID: ${issue.assignee_id})`}
            </Text>
          </Box>

          <Button
            leftIcon={<BiArrowBack />}
            mt={4}
            colorScheme="blue"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </CardBody>
      </Card>
    </Box>
  );
}
